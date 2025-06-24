# transcription_service/main.py
import sys
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
import io
import os
import tempfile
from pydub import AudioSegment # Necesario para procesar los blobs del navegador

# --- Configuración y carga del modelo Whisper (una sola vez al inicio de la aplicación) ---
# Los valores se pueden obtener de variables de entorno o ser fijos.
# Es mejor usar variables de entorno para desplegar en diferentes entornos (CPU/GPU)
model_size = os.environ.get("WHISPER_MODEL_SIZE", "base") # Default a "base"
device = os.environ.get("WHISPER_DEVICE", "cpu") # Default a "cpu", cambia a "cuda" si tienes GPU
compute_type = os.environ.get("WHISPER_COMPUTE_TYPE", "int8") # int8 para CPU, float16 para GPU

# Validar y ajustar compute_type si es necesario
if device == "cuda" and compute_type == "int8":
    print("ADVERTENCIA: Usando 'int8' con 'cuda'. Considera 'float16' para GPU para mejor rendimiento.", file=sys.stderr)
    # compute_type = "float16" # Si quieres forzarlo a float16 para GPU

try:
    print(f"INFO: Cargando modelo Whisper '{model_size}' en '{device}' con compute_type '{compute_type}'...", file=sys.stderr)
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    print("INFO: Modelo Whisper cargado exitosamente.", file=sys.stderr)
except Exception as e:
    print(f"ERROR: No se pudo cargar el modelo Whisper: {e}", file=sys.stderr)
    # Es crucial que la aplicación no se inicie si el modelo no carga
    raise RuntimeError(f"Fallo al cargar el modelo Whisper: {e}")

app = FastAPI()

# --- Funciones de transcripción adaptadas ---
# La función transcribe_audio_and_get_data será adaptada para tomar bytes/ruta de archivo temporal

def transcribe_audio_segment(audio_path, language="es", initial_prompt="", task="transcribe"):
    try:
        segments_generator, info = model.transcribe(
            audio_path,
            language=language,
            initial_prompt=initial_prompt,
            word_timestamps=False, # Si no necesitas timestamps por palabra
            vad_filter=True, # Identifica silencios
            task=task
        )

        full_transcription = " ".join([segment.text.strip() for segment in segments_generator])
        
        # Opcional: Si quieres devolver los segmentos individuales también, descomenta
        # transcription_segments = []
        # for segment in segments_generator:
        #     transcription_segments.append({
        #         "start": segment.start,
        #         "end": segment.end,
        #         "text": segment.text.strip()
        #     })

        return {
            "full_text": full_transcription.strip(),
            # "segments": transcription_segments, # Descomentar si se necesitan segmentos
            "detected_language": info.language
        }

    except Exception as e:
        print(f"ERROR: Error durante la transcripción: {e}", file=sys.stderr)
        return {
            "full_text": "",
            # "segments": [],
            "detected_language": language # o None, dependiendo de si quieres devolverlo o no en caso de error
        }

# --- Endpoint para transcripción en vivo ---
@app.post("/transcribe-live/")
async def transcribe_live_audio(
    audio_file: UploadFile = File(...), # El archivo de audio (chunk)
    language: str = "es",              # Idioma para la transcripción
    initial_prompt: str = "",          # Prompt inicial si se usa
    task: str = "transcribe"           # 'transcribe' o 'translate'
):
    """
    Recibe un chunk de audio, lo transcribe en tiempo real y devuelve el texto.
    Espera archivos en formatos comunes como webm, ogg, wav.
    """
    if task not in ["transcribe", "translate"]:
        raise HTTPException(status_code=400, detail="La tarea debe ser 'transcribe' o 'translate'.")

    # Crear un archivo temporal para el chunk de audio recibido
    # Es importante usar el sufijo correcto (ej. .webm) para que pydub/ffmpeg lo reconozca
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        temp_audio.write(await audio_file.read())
        temp_audio_path = temp_audio.name

    print(f"INFO: Chunk de audio temporal guardado en: {temp_audio_path}", file=sys.stderr)

    try:
        # Transcribir el chunk de audio
        result_data = transcribe_audio_segment(
            temp_audio_path,
            language=language,
            initial_prompt=initial_prompt,
            task=task
        )

        return JSONResponse(content=result_data)

    except Exception as e:
        print(f"ERROR: Fallo al procesar el chunk de audio: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Error al transcribir el audio: {str(e)}")
    finally:
        # Asegurarse de eliminar el archivo temporal
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

# --- Endpoint para texto a voz (opcional, desde tu script original) ---
# Puedes mantenerlo aquí o en un servicio separado
from gtts import gTTS

@app.post("/synthesize-speech/")
async def synthesize_speech(text: str, lang: str = 'es'):
    """
    Convierte un texto dado a un archivo de audio MP3 y lo devuelve.
    """
    # Crear un archivo temporal para el audio generado
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_tts_file:
        temp_tts_path = temp_tts_file.name

    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(temp_tts_path)
        
        # Leer el archivo generado para devolverlo como una respuesta de streaming
        with open(temp_tts_path, "rb") as f:
            audio_bytes = f.read()

        return JSONResponse(content={"status": "success", "file_path": temp_tts_path, "audio_base64": base64.b64encode(audio_bytes).decode('utf-8')})
        # Otra opción es devolver el archivo directamente para que NestJS lo sirva
        # return FileResponse(temp_tts_path, media_type="audio/mpeg")

    except Exception as e:
        print(f"ERROR: No se pudo generar el audio para el texto '{text[:50]}...': {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Error al generar el audio: {str(e)}")
    finally:
        if os.path.exists(temp_tts_path):
            os.remove(temp_tts_path)


if __name__ == "__main__":
    import uvicorn
    # Para producción, deberías usar Gunicorn delante de Uvicorn.
    uvicorn.run(app, host="0.0.0.0", port=8001)