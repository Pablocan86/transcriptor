// src/App.js
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5001");

// Asegúrate de que esta URL coincida con la dirección de tu servidor NestJS

function Stream() {
  const [transcription, setTranscription] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Conectado al servidor WebSocket");
    });

    socket.on("transcription", (text) => {
      setTranscription((prevTranscription) => [...prevTranscription, text]);
    });

    socket.on("disconnect", () => {
      console.log("Desconectado del servidor WebSocket");
    });

    return () => {
      socket.off("connect");
      socket.off("transcription");
      socket.off("disconnect");
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm; codecs=opus",
      }); // Especificar mimeType
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // El event.data es un Blob. Se envía directamente.
          socket.emit("audioChunk", event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log("Grabación detenida. Audio finalizado.");
      };

      // Envía datos cada 500ms o 1000ms. Ajusta esto para obtener chunks de audio razonables
      mediaRecorderRef.current.start(300);
      setIsRecording(true);
      setTranscription([]);
      console.log("Grabando...");
    } catch (error) {
      console.error("Error al iniciar la grabación:", error);
      alert("Se necesita permiso para acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      console.log("Grabación detenida.");
    }
  };

  return (
    <div className="p-5 min-h-[75vh] dark:bg-neutral-800">
      <h1 className="dark:text-white text-center text-2xl">
        TRANSCRIPTOR EN TIEMPO REAL
      </h1>
      <div className="bg-white dark:bg-neutral-900 p-4 rounded shadow-2xl mt-1  dark:text-white">
        <div>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-[#0365ce] text-white p-2 rounded hover:bg-#024a97 cursor-pointer"
            >
              Iniciar Grabación
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-900 text-white p-2 rounded hover:bg-#024a97 cursor-pointer"
            >
              Detener Grabación
            </button>
          )}
        </div>

        <hr style={{ margin: "20px 0" }} />

        <div>
          <h2>Transcripción en Vivo:</h2>
          <div
          className="bg-[#ffffff] border dark:bg-neutral-500 rounded"
            style={{
              padding: "10px",
              height: "300px",
              overflowY: "scroll"
            }}
          >
            {transcription.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stream;
