import sys
import os
import json # Necesario para devolver JSON al servicio Nest
from faster_whisper import WhisperModel, BatchedInferencePipeline
from gtts import gTTS 



# --- Configuración y carga del modelo Whisper (una sola vez al inicio del script) ---
# model_size = "large-v3"  # Las opciones "tiny, small, medium, large-v3"
device = "cuda" if os.environ.get("USE_GPU", "false").lower() == "true" else "cpu"
compute_type = "float16" if device == "cuda" else "int8"

# try:
#     model = WhisperModel(model_size, device=device, compute_type=compute_type)
#     # batched_model = BatchedInferencePipeline(model=model) //  Hace más rápida la transcripción pero no agregra comas ni puntuaciones.
   
# except Exception as e:
#     print(f"ERROR: No se pudo cargar el modelo Whisper: {e}", file=sys.stderr)
#     sys.exit(1)

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def format_time_for_srt(seconds): 
    hours = int(seconds / 3600)
    seconds %= 3600
    minutes = int(seconds / 60)
    seconds %= 60
    milliseconds = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{int(seconds):02d},{milliseconds:03d}"

def transcribe_audio_and_get_data(audio_path, language="es", initial_prompt="",task="transcribe"):
    
    try:
        segments_generator, info = model.transcribe( # Si uso BatchedInferencePipeline tengo que pasar la variable acá
            audio_path,
            language=language,
            initial_prompt=initial_prompt,
            word_timestamps=False,
            vad_filter=True, #Identifica silencios
            task=task
        )



        transcription_segments = []
        full_transcription = ""
        for segment in segments_generator:
            segment_text = segment.text.strip()
            transcription_segments.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment_text
            })
            full_transcription += segment_text + " "

        
        return {
            "full_text": full_transcription.strip(),
            "segments": transcription_segments,
              "detected_language": info.language
        }

    except Exception as e:
        print(f"ERROR: Error durante la transcripción: {e}", file=sys.stderr)
        return {
            "full_text": "",
            "segments": [],
              "detected_language": info.language
        }

def text_to_speech(text, lang='es', output_file="output.mp3"):
    """
    Convierte un texto dado a un archivo de audio MP3.

    Args:
        text (str): El texto a convertir a voz.
        lang (str): El código de idioma (ej. 'es' para español, 'en' para inglés).
        output_file (str): El nombre del archivo MP3 de salida.
    
    Returns:
        str: La ruta del archivo de audio generado, o None si hay un error.
    """
    try:
        tts = gTTS(text=text, lang=lang, slow=False) # slow=False para voz a velocidad normal
        tts.save(output_file)
        
        # print(f"INFO: Audio generado en '{output_file}'.", file=sys.stderr)
        
        return output_file
    except Exception as e:
        print(f"ERROR: No se pudo generar el audio para el texto '{text[:50]}...': {e}", file=sys.stderr)
        return None
    
if __name__ == "__main__":
    # Primer argumento: el modo de operación ('transcribe' o 'synthesize')
    if len(sys.argv) < 2:
        print("ERROR: Uso: python script.py <modo> [argumentos del modo]", file=sys.stderr)
        print("Modos disponibles: transcribe, synthesize", file=sys.stderr)
        sys.exit(1)

    mode = sys.argv[1].lower()

    if mode == "transcribe":
        if len(sys.argv) < 6: # Ajustado a 7 argumentos para incluir la tarea
            print("ERROR (transcribe): Uso: python script.py transcribe <ruta_audio> <tamaño_modelo> <idioma> <prompt_inicial> <tarea>", file=sys.stderr)
            print("La tarea puede ser 'transcribe' o 'translate'.", file=sys.stderr)
            sys.exit(1)

        audio_file = sys.argv[2]
        model_size_arg = sys.argv[3]
        language_arg = sys.argv[4]
        prompt_arg = sys.argv[5]
        task_arg = sys.argv[6].lower()

        if task_arg not in ["transcribe", "translate"]:
            print("ERROR: La tarea debe ser 'transcribe' o 'translate'.", file=sys.stderr)
            sys.exit(1)

        try:
            model = WhisperModel(model_size_arg, device=device, compute_type=compute_type)
        except Exception as e:
            print(f"ERROR: No se pudo cargar el modelo Whisper: {e}", file=sys.stderr)
            sys.exit(1)

        result_data = transcribe_audio_and_get_data(
            audio_file,
            language=language_arg,
            initial_prompt=prompt_arg,
            task=task_arg
        )
        print(json.dumps(result_data, ensure_ascii=False, indent=2))

    elif mode == "synthesize":
        if len(sys.argv) < 4:
            print("ERROR (synthesize): Uso: python script.py synthesize <texto_a_hablar> <idioma> [archivo_salida.mp3]", file=sys.stderr)
            sys.exit(1)

        text_to_speak = sys.argv[2]
        lang_for_tts = sys.argv[3]
        output_tts_file = sys.argv[4] if len(sys.argv) > 4 else "output_speech.mp3"

        generated_file = text_to_speech(text_to_speak, lang=lang_for_tts, output_file=output_tts_file)
        if generated_file:
            print(json.dumps({"status": "success", "message": f"Audio generado en {generated_file}", "file_path": generated_file}, ensure_ascii=False, indent=2))
        else:
            print(json.dumps({"status": "error", "message": "Fallo al generar el audio"}, ensure_ascii=False, indent=2))

    else:
        print(f"ERROR: Modo '{mode}' no reconocido. Modos disponibles: transcribe, synthesize", file=sys.stderr)
        sys.exit(1)