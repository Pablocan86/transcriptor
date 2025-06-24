// src/App.js
import React, { useEffect, useState,useRef } from 'react';


 // Asegúrate de que esta URL coincida con la dirección de tu servidor NestJS

function Stream({socket}) {
  const [transcription, setTranscription] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado al servidor WebSocket');
    });

    socket.on('transcription', (text) => {
      setTranscription((prevTranscription) => [...prevTranscription, text]);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor WebSocket');
    });

    return () => {
      socket.off('connect');
      socket.off('transcription');
      socket.off('disconnect');
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' }); // Especificar mimeType
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // El event.data es un Blob. Se envía directamente.
          socket.emit('audioChunk', event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('Grabación detenida. Audio finalizado.');
      };

      // Envía datos cada 500ms o 1000ms. Ajusta esto para obtener chunks de audio razonables
      mediaRecorderRef.current.start(500);
      setIsRecording(true);
      setTranscription([]);
      console.log('Grabando...');
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      alert('Se necesita permiso para acceder al micrófono.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log('Grabación detenida.');
    }
  };
  console.log(transcription)

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Transcripción en Tiempo Real (Microservicio Python)</h1>

      <div>
        {!isRecording ? (
          <button onClick={startRecording} style={{ padding: '10px 20px', fontSize: '18px', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer' }}>
            Iniciar Grabación
          </button>
        ) : (
          <button onClick={stopRecording} style={{ padding: '10px 20px', fontSize: '18px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>
            Detener Grabación
          </button>
        )}
      </div>

      <hr style={{ margin: '20px 0' }} />

      <div>
        <h2>Transcripción en Vivo:</h2>
        <div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'scroll', backgroundColor: '#f9f9f9' }}>
          {transcription.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Stream;