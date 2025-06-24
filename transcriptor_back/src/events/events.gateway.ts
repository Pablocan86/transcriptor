// src/events/events.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Queue } from 'queue-typescript';
import axios from 'axios'; 

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  maxHttpBufferSize: 1e7, // Aumenta el tamaño máximo del buffer
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private audioBuffer: { [clientId: string]: Buffer } = {};
  private transcriptionQueue: Queue<() => Promise<void>> = new Queue();
  private isProcessingQueue = false;

  // URL de tu microservicio de Python
  private readonly PYTHON_TRANSCRIPTION_SERVICE_URL = 'http://localhost:8001/transcribe-live/';

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    this.audioBuffer[client.id] = Buffer.from([]);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    delete this.audioBuffer[client.id];
  }

  @SubscribeMessage('audioChunk')
  async handleAudioChunk(
    @MessageBody() data: Buffer,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.audioBuffer[client.id] = Buffer.concat([this.audioBuffer[client.id], data]);

    const CHUNK_PROCESS_SIZE = 250000; // Aproximadamente 5 segundos de audio (ajustar)

    if (this.audioBuffer[client.id].length >= CHUNK_PROCESS_SIZE) {
      const audioToProcess = this.audioBuffer[client.id];
      this.audioBuffer[client.id] = Buffer.from([]); // Limpiar el buffer

      this.transcriptionQueue.enqueue(async () => {
        try {
          // Envía el chunk de audio al microservicio de Python
          const formData = new FormData();
          // Importante: El nombre 'audio_file' debe coincidir con el parámetro de FastAPI
          // En NestJS (Node.js), un Buffer puede ser tratado como un Blob o un archivo para FormData
          // Si el cliente está enviando `event.data` directamente, suele ser un Blob de tipo `audio/webm`.
          // Axios/FormData manejará esto bien.
          formData.append('audio_file', new Blob([audioToProcess], { type: 'audio/webm' }), 'audio.webm');

        // --- CORRECTED LINE BELOW ---
        const response = await axios.post(this.PYTHON_TRANSCRIPTION_SERVICE_URL, formData);
        // --- END CORRECTED LINE ---

        // Also, remember to adjust the response data key from 'transcription' to 'full_text'
        // based on the Python microservice's actual response structure.
        const { full_text } = response.data;
        if (full_text) {
          client.emit('transcription', full_text);
          
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          console.error(`Error del servicio de transcripción: ${error.response.status} - ${error.response.data.detail || error.response.data}`);
        } else {
          console.error('Error durante la transcripción en cola:', error);
        }
      }
    });

      this.processTranscriptionQueue();
    }
  }

  private async processTranscriptionQueue() {
    if (this.isProcessingQueue) {
      return;
    }
    this.isProcessingQueue = true;

    while (this.transcriptionQueue.length > 0) {
      const task = this.transcriptionQueue.dequeue();
      if (task) {
        await task();
      }
    }
    this.isProcessingQueue = false;
  }
}