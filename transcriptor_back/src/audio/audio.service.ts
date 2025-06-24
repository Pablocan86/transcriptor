// src/transcription/transcription.service.ts
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

@Injectable()
export class AudioService {
  constructor() {}

  async transcribeAudio(
    file: Express.Multer.File,
    modelSize: string = 'large-v3',
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException(
        'No se proporcionó ningún archivo multimedia.',
      );
    }

    const filePath = path.join(UPLOADS_DIR, file.originalname);
    //Script de Python
    const pythonScriptPath = path.join(
      process.cwd(),
      'scripts',
      'transcribe_audio.py',
    );
    const pythonExecutable =
      process.platform === 'win32'
        ? path.join(process.cwd(), 'venv_whisper', 'Scripts', 'python.exe')
        : path.join(process.cwd(), 'venv_whisper', 'bin', 'python');

    try {
      await fs.promises.writeFile(filePath, file.buffer);

      let fullOutput = ''; // Para capturar toda la salida de stdout
      let stderrOutput = ''; // Para capturar la salida de error

      const language = 'es';
      const initialPrompt =
        'El audio es de una audiencia en un expediente judicial en español.'; // Tu prompt
      const operationMode = 'transcribe';
      const transcriptionTask = 'transcribe';

      const childProcess = spawn(
        pythonExecutable,
        [
          pythonScriptPath,
          operationMode,
          filePath,
          modelSize,
          language,
          initialPrompt,
          transcriptionTask,
        ],
        {
          env: {
            ...process.env,
            USE_GPU: process.env.USE_GPU || 'false',
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );

      childProcess.stdout.on('data', (data) => {
        fullOutput += data.toString('utf-8');
      });

      console.log(modelSize)

      childProcess.stderr.on('data', (data) => {
        const errorMsg = data.toString('utf-8');
        console.error(`stderr from Python: ${errorMsg}`);
        stderrOutput += errorMsg;
      });

      const transcriptionPromise = new Promise<any>((resolve, reject) => {
        childProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const parsedResult = JSON.parse(fullOutput);
              resolve(parsedResult);
            } catch (parseError) {
              console.error(
                `Error al parsear JSON del script Python: ${parseError.message}. Raw output: "${fullOutput.substring(0, 500)}..."`,
              );
              reject(
                new InternalServerErrorException(
                  'El script de Python devolvió una respuesta JSON inválida.',
                ),
              );
            }
          } else {
            const errorMessage = `El script de Python finalizó con código de error ${code}.`;
            const detailedError = `Detalles: ${stderrOutput || 'No hay salida de error.'} Salida estándar (parcial): ${fullOutput.substring(0, 500)}...`;
            reject(new Error(`${errorMessage} ${detailedError}`));
          }
        });

        childProcess.on('error', (err) => {
          reject(
            new Error(
              `Fallo al iniciar el proceso de Python: ${err.message}. Revise la ruta del ejecutable o del script.`,
            ),
          );
        });
      });

      const scriptResult = await transcriptionPromise; // Esto ahora es el objeto JSON completo

      // Simplemente devuelve el objeto JSON completo al controlador
      return scriptResult;
    } catch (error) {
      console.error(`Error en la transcripción: ${error.message}`);
      throw new InternalServerErrorException(
        `Error durante la transcripción: ${error.message}`,
      );
    } finally {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
  }

  // --- Nueva función para sintetizar voz ---

  async synthesizeText(
    textToSpeak: string,
    language: string,
    outputFile: string = 'output_speech.mp3',
  ): Promise<any> {
    const pythonScriptPath = path.join(
      process.cwd(),
      'scripts',
      'transcribe_audio.py',
    );
    const pythonExecutable =
      process.platform === 'win32'
        ? path.join(process.cwd(), 'venv_whisper', 'Scripts', 'python.exe')
        : path.join(process.cwd(), 'venv_whisper', 'bin', 'python');

    try {
      let fullOutput = '';
      let stderrOutput = '';

      const operationMode = 'synthesize';

      const childProcess = spawn(
        pythonExecutable,
        [pythonScriptPath, operationMode, textToSpeak, language, outputFile],
        {
          env: {
            ...process.env,
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );

      childProcess.stdout.on('data', (data) => {
        fullOutput += data.toString('utf-8');
      });

      childProcess.stderr.on('data', (data) => {
        const errorMsg = data.toString('utf-8');
        console.error(`stderr from Python (synth): ${errorMsg}`);
        stderrOutput += errorMsg;
      });

      const synthesisPromise = new Promise<any>((resolve, reject) => {
        childProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const parsedResult = JSON.parse(fullOutput);
              resolve(parsedResult);
            } catch (parseError) {
              console.error(
                `Error al parsear JSON del script Python (synth): ${parseError.message}. Raw output: "${fullOutput.substring(0, 500)}..."`,
              );
              reject(
                new InternalServerErrorException(
                  'El script de Python devolvió una respuesta JSON inválida para síntesis.',
                ),
              );
            }
          } else {
            const errorMessage = `El script de Python finalizó con código de error ${code} para síntesis.`;
            const detailedError = `Detalles: ${stderrOutput || 'No hay salida de error.'} Salida estándar (parcial): ${fullOutput.substring(0, 500)}...`;
            reject(new Error(`${errorMessage} ${detailedError}`));
          }
        });

        childProcess.on('error', (err) => {
          reject(
            new Error(
              `Fallo al iniciar el proceso de Python para síntesis: ${err.message}.`,
            ),
          );
        });
      });

      const scriptResult = await synthesisPromise;
      return scriptResult;
    } catch (error) {
      console.error(`Error en la síntesis de voz: ${error.message}`);
      throw new InternalServerErrorException(
        `Error durante la síntesis de voz: ${error.message}`,
      );
    }
  }
}
