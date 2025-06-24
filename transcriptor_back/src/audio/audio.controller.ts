import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  Res,
  Get,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AudioService } from './audio.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Get('/hola')
  getHola(): object {
    return { success: true, message: 'Hola desde el servidor!' };
  }

  @Post('/transcribir')
  @UseInterceptors(
    FileInterceptor('multimedia', {
      // limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Body('modelSize') modelSize: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException(
        'No se recibió audio ni video',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const transcriptionResult = await this.audioService.transcribeAudio(file,modelSize);

      res.status(HttpStatus.OK).json(transcriptionResult);
    } catch (error) {
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Error interno del servidor',
      });
    }
  }

  @Post('synthesize') // Define un endpoint POST en /synthesize
  async synthesizeSpeech(
    @Body('text') text: string,
    @Body('language') language: string,
    @Res() res: Response,
  ) {
    if (!text) {
      throw new BadRequestException('El campo "text" es requerido.');
    }
    if (!language) {
      throw new BadRequestException('El campo "language" es requerido.');
    }

    // Generar un nombre de archivo único para evitar colisiones
    const uniqueFileName = `synthesized_speech_${Date.now()}.mp3`;
    const outputPath = path.join(process.cwd(), 'uploads', uniqueFileName);

    try {
      // Llamar al servicio para generar el audio
      const result = await this.audioService.synthesizeText(
        text,
        language,
        uniqueFileName,
      );

      // Verifica que la respuesta del script Python incluya la ruta al archivo
      if (result && result.status === 'success' && result.file_path) {
        // Envía el archivo de audio como respuesta
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${uniqueFileName}"`,
        );
        // Envía el archivo directamente usando res.sendFile
        res.sendFile(path.resolve(result.file_path), (err) => {
          if (err) {
            console.error(
              `Error al enviar el archivo de audio: ${err.message}`,
            );
            // Maneja el error, por ejemplo, eliminando el archivo si el envío falla
            if (fs.existsSync(result.file_path)) {
              fs.promises
                .unlink(result.file_path)
                .catch((e) =>
                  console.error(
                    'Error al eliminar archivo tras fallo de envío:',
                    e,
                  ),
                );
            }
            throw new InternalServerErrorException(
              'No se pudo enviar el archivo de audio.',
            );
          } else {
            // Una vez que el archivo se ha enviado correctamente, elimínalo del servidor
            if (fs.existsSync(result.file_path)) {
              fs.promises
                .unlink(result.file_path)
                .catch((e) => console.error('Error al eliminar archivo:', e));
            }
          }
        });
      } else {
        throw new InternalServerErrorException(
          'El script de síntesis no devolvió una ruta de archivo válida.',
        );
      }
    } catch (error) {
      console.error(`Error en el controlador de síntesis: ${error.message}`);
      // Asegúrate de que el archivo temporal se elimine si ocurre un error antes de enviarlo
      if (fs.existsSync(outputPath)) {
        fs.promises
          .unlink(outputPath)
          .catch((e) =>
            console.error(
              'Error al eliminar archivo tras un error en la síntesis:',
              e,
            ),
          );
      }
      throw new InternalServerErrorException('Error al generar la voz.');
    }
  }
}
