import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

// Función para validar los archivos
const isValidAudioVideo = (file) => {
  const acceptedTypes = [
    "audio/mpeg",
    "video/mp4",
    "audio/wav",
    "audio/webm",
    "audio/flac",
    "audio/mp3",
    "audio/ogg",
  ];
  return acceptedTypes.includes(file.type);
};

function formatTimeForSrt(seconds) {
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const ms = Math.floor(
    (remainingSeconds - Math.floor(remainingSeconds)) * 1000
  );
  const s = Math.floor(remainingSeconds);

  return (
    [hours, minutes, s].map((n) => n.toString().padStart(2, "0")).join(":") +
    "," +
    ms.toString().padStart(3, "0")
  );
}

export const Transcriptor = ({ isDark }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [lastTranscriptionData, setLastTranscriptionData] = useState(null);
  const [processingTextInterval, setProcessingTextInterval] = useState(null);
  const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(false);
  const [loadingText, setLoadingText] = useState("Cargando...");
  const [progressBarWidth, setProgressBarWidth] = useState("0%");
  const [avisoProgress, setAvisoProgress] = useState("");
  const [transcriptionResultText, setTranscriptionResultText] = useState("");
  const [segmentsHtml, setSegmentsHtml] = useState(null);
  const [showTxtView, setShowTxtView] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("first");

  // --- Referencias a elementos del DOM ---
  const dropAreaRef = useRef(null);
  const audioInputRef = useRef(null);
  const selectModelRef = useRef(null);

  // --- useEffect para limpieza de intervalos y lógica inicial ---
  useEffect(() => {
    // Al cargar el componente o cuando selectedFile cambia, resetea la vista
    if (!selectedFile) {
      // Lógica para cuando no hay archivo seleccionado: limpiar resultados, etc.
      setLastTranscriptionData(null);
      setTranscriptionResultText("");
      setSegmentsHtml(null);
      setDownloadFormat("first");
    }

    // Limpieza de intervalos al desmontar el componente
    return () => {
      if (processingTextInterval) {
        clearInterval(processingTextInterval);
      }
    };
  }, [selectedFile, processingTextInterval]); // Dependencias para re-renderizar si selectedFile o processingTextInterval cambian

  // --- Funciones Manejadoras de Eventos ---

  const handleFileChange = useCallback((event) => {
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (!isValidAudioVideo(file)) {
        Swal.fire({
          title: "Error!",
          text: "Debe ser un archivo de audio o video válido (mp3, mp4, wav, etc.)",
          icon: "error",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        });
        setSelectedFile(null);
        event.target.value = "";
        return;
      }
      setSelectedFile(file); // Actualiza el estado con el objeto File
    } else {
      setSelectedFile(null);
    }
    event.target.value = "";
  }, []);

  const preventDefaults = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(
    (e) => {
      preventDefaults(e);
      if (dropAreaRef.current) dropAreaRef.current.classList.add("highlight");
    },
    [preventDefaults]
  );

  const handleDragOver = useCallback(
    (e) => {
      preventDefaults(e);
      if (dropAreaRef.current) dropAreaRef.current.classList.add("highlight");
    },
    [preventDefaults]
  );

  const handleDragLeave = useCallback(
    (e) => {
      preventDefaults(e);
      if (dropAreaRef.current)
        dropAreaRef.current.classList.remove("highlight");
    },
    [preventDefaults]
  );

  const handleDrop = useCallback(
    (e) => {
      preventDefaults(e);
      if (dropAreaRef.current)
        dropAreaRef.current.classList.remove("highlight");

      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        const file = files[0];
        if (!isValidAudioVideo(file)) {
          Swal.fire({
            title: "Error!",
            text: "Debe ser un archivo de audio o video válido (mp3, mp4, wav, etc.)",
            icon: "error",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#3085d6",
          });
          setSelectedFile(null);
          return;
        }
        setSelectedFile(file); // Actualiza el estado con el objeto File
      } else {
        setSelectedFile(null);
      }
    },
    [preventDefaults]
  );

  // --- Lógica de Subida y Transcripción (sin cambios mayores aquí) ---
  const uploadAndTranscribe = useCallback(
    async (file) => {
      if (!file) {
        Swal.fire({
          title: "Atención",
          text: "Debe subir un archivo de audio o video",
          icon: "warning",
          iconColor: "red",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      setLoadingText("Iniciando carga...");
      setLoadingOverlayVisible(true);
      setProgressBarWidth("0%");
      setTranscriptionResultText("");
      setSegmentsHtml(null);
      setAvisoProgress(
        "Por favor, no cierre la ventana mientras se procesa la transcripción."
      );
      setIsTranscribing(true);
      setLastTranscriptionData(null);
      setDownloadFormat("first");

      if (processingTextInterval) {
        clearInterval(processingTextInterval);
        setProcessingTextInterval(null);
      }

      try {
        const formData = new FormData();
        formData.append("multimedia", file);
        formData.append(
          "modelSize",
          selectModelRef.current ? selectModelRef.current.value : "medium"
        );

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setProgressBarWidth(`${percentComplete}%`);
            setLoadingText(`Subiendo archivo: ${percentComplete.toFixed(0)}%`);
          }
        });

        const responsePromise = new Promise((resolve, reject) => {
          xhr.open("POST", "http://5.5.4.39:5001/api/transcribir");
          xhr.setRequestHeader("Accept", "application/json");

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                reject(
                  new Error("Error al parsear la respuesta JSON del servidor.")
                );
              }
            } else {
              let errorText = "Error desconocido del servidor.";
              try {
                const errorData = JSON.parse(xhr.responseText);
                errorText = errorData.error || errorData.message || errorText;
              } catch {
                errorText = xhr.responseText || errorText;
              }
              reject(new Error(errorText));
            }
          };

          xhr.onerror = () => {
            reject(
              new Error("Error de red al intentar conectar con el servidor.")
            );
          };

          xhr.send(formData);
        });

        setProgressBarWidth("100%");
        setLoadingText("Archivo subido. Procesando transcripción...");

        let transcriptionProgress = 0;
        const intervalId = setInterval(() => {
          if (transcriptionProgress < 95) {
            transcriptionProgress += 2;
            setProgressBarWidth(`${transcriptionProgress * 1 + 1}%`);
            setLoadingText(`Transcribiendo...`);
          }
        }, 1000);
        setProcessingTextInterval(intervalId);

        const data = await responsePromise;

        if (intervalId) {
          clearInterval(intervalId);
          setProcessingTextInterval(null);
        }
        setProgressBarWidth("100%");
        setLoadingText("Transcripción completada.");

        setLastTranscriptionData(data);

        let fullText = data.full_text || "";
        if (typeof fullText === "string" && fullText.length > 0) {
          fullText = fullText.charAt(0).toUpperCase() + fullText.slice(1);
          if (!fullText.endsWith(".")) {
            fullText += ".";
          }
        }
        setTranscriptionResultText(fullText);

        const segmentsJsx = (data.segments || []).map((s, index) => (
          <p key={index}>
            {index + 1} - [{formatTimeForSrt(s.start)} -{" "}
            {formatTimeForSrt(s.end)}] : {s.text}
          </p>
        ));
        setSegmentsHtml(segmentsJsx);

        setShowTxtView(true);
      } catch (error) {
        console.error("Error al transcribir el audio:", error);
        setTranscriptionResultText(`Error: ${error.message}`);
        Swal.fire({
          title: "Error de Transcripción",
          text: error.message,
          icon: "error",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        });
      } finally {
        setIsTranscribing(false);
        setTimeout(() => {
          setLoadingOverlayVisible(false);
        }, 500);
      }
    },
    [processingTextInterval]
  );

  const handleTranscribeClick = useCallback(() => {
    if (!selectedFile) {
      Swal.fire({
        title: "Atención",
        text: "Debe subir un archivo de audio o video",
        icon: "warning",
        iconColor: "red",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    uploadAndTranscribe(selectedFile);
  }, [selectedFile, uploadAndTranscribe]);

  const handleVerTxt = useCallback(() => {
    setShowTxtView(true);
  }, []);

  const handleVerSrt = useCallback(() => {
    setShowTxtView(false);
  }, []);

  const handleDownloadClick = useCallback(
    (event) => {
      if (
        !lastTranscriptionData ||
        (!lastTranscriptionData.full_text &&
          (!lastTranscriptionData.segments ||
            lastTranscriptionData.segments.length === 0))
      ) {
        Swal.fire({
          title: "Atención",
          text: "No hay transcripción disponible para descargar.",
          icon: "warning",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        });
        event.preventDefault();
        return;
      }

      const selectedFormat = downloadFormat;

      let contentToDownload = "";
      let filename = "transcripcion_resultado";

      if (selectedFormat === "txt") {
        if (lastTranscriptionData.full_text) {
          contentToDownload = lastTranscriptionData.full_text;
        } else {
          contentToDownload = (lastTranscriptionData.segments || [])
            .map((segment) => segment.text)
            .join("\n");
        }
        filename += ".txt";
      } else if (selectedFormat === "srt") {
        if (
          lastTranscriptionData.segments &&
          Array.isArray(lastTranscriptionData.segments) &&
          lastTranscriptionData.segments.length > 0
        ) {
          let srtContent = "";
          let counter = 1;
          lastTranscriptionData.segments.forEach((segment) => {
            const start = formatTimeForSrt(segment.start);
            const end = formatTimeForSrt(segment.end);
            srtContent += `${counter}\n`;
            srtContent += `${start} --> ${end}\n`;
            srtContent += `${segment.text}\n\n`;
            counter++;
          });
          contentToDownload = srtContent;
          filename += ".srt";
        } else {
          Swal.fire({
            title: "Atención",
            text: "No hay datos de segmento disponibles para generar el archivo SRT.",
            icon: "warning",
            iconColor: "red",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#3085d6",
          });
          event.preventDefault();
          return;
        }
      } else {
        Swal.fire({
          title: "Error",
          text: "Formato de descarga no válido. Seleccione TXT o SRT.",
          icon: "error",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        });
        event.preventDefault();
        return;
      }

      const blob = new Blob([contentToDownload], {
        type: `text/${selectedFormat};charset=utf-8`,
      });
      const url = URL.createObjectURL(blob);

      event.currentTarget.href = url;
      event.currentTarget.download = filename;

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    },
    [lastTranscriptionData, downloadFormat]
  );

  const getFileIcon = useCallback((file) => {
    if (!file) return null;
    if (file.type.startsWith("audio/")) {
      return "./assets/images/audio.svg";
    } else if (file.type.startsWith("video/")) {
      return "./assets/images/video.svg";
    }
    return null;
  }, []);

  return (
    <div className="flex flex-col items-center justify-evenly dark:bg-neutral-800">
      {/* Overlay de Carga */}
      {loadingOverlayVisible && (
        <div
          id="loadingOverlay"
          style={{
            display: "flex", // Asegura que esté visible
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          <div
            className="flex flex-col items-center justify-evenly"
            id="loadingContainer"
            style={{
              backgroundColor: "#333",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              width: "80%",
              maxWidth: "400px",
            }}
          >
            <h4 id="loadingText">{loadingText}</h4>
            <div
              style={{
                width: "100%",
                height: "20px",
                backgroundColor: "#e0e0e0",
                borderRadius: "10px",
                overflow: "hidden",
                marginTop: "10px",
              }}
            >
              <div
                id="progressBar"
                style={{
                  width: progressBarWidth,
                  height: "100%",
                  backgroundColor: "#007bff",
                  transition: "width 0.1s ease-out",
                }}
              ></div>
            </div>
            <img
              style={{ marginTop: "20px" }}
              src="./assets/images/Loading_2.gif"
              alt="animación de loading"
              width="100px"
              height="100px"
            />
          </div>
          <p id="avisoProgress" style={{ marginTop: "15px", color: "black" }}>
            {avisoProgress}
          </p>
        </div>
      )}

      <h2 className="text-2xl font-semibold pt-5 dark:text-white">
        TRANSCRIPTOR DE AUDIENCIAS
      </h2>

      <div className="div_adv bg-[#ffffff] dark:bg-neutral-900 dark:text-white">
        <p style={{ fontWeight: 600 }}>Aviso Importante:</p>
        <p>- Este sistema se encuentra en fase de pruebas.</p>
        <p>
          - El tiempo de transcripción varía dependiendo el tamaño del archivo y
          el nivel de precisión seleccionado.
        </p>
        <p>
          - La transcripción se realiza mediante inteligencia artificial y puede
          contener errores u omisiones.
        </p>
        <p>
          - Se recomienda verificar cuidadosamente el contenido de las
          transcripciones generadas.
        </p>
        <p>
          - El uso de esta herramienta y la validación de sus resultados son
          responsabilidad exclusiva del usuario.
        </p>
      </div>

      <section
        id="container"
        className="bg-[#ffffff] dark:bg-neutral-900 dark:text-white"
      >
        <div className="cargaAudio">
          {/* Drop Area */}
          <div
            id="drop-area"
            ref={dropAreaRef}
            className={`drop-area ${selectedFile ? "has-file" : ""}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            // onClick={() =>
            //   audioInputRef.current && audioInputRef.current.click()
            // }
          >
            <input
              type="file"
              id="audioInput"
              ref={audioInputRef}
              accept="audio/*,video/mp4,video/mpeg,video/webm"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <label
              className="drop-area-content"
              htmlFor="audioInput"
              style={{ cursor: "pointer" }}
            >
              <button id="openFileButton" className="open-file-button">
                Haga click o arrastre un archivo para cargarlo
              </button>
              <div className="upload-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  fill="currentColor"
                  className="upload-icon"
                >
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                </svg>
              </div>
            </label>
          </div>

          {/* File List Container */}
          <div id="file-list" className={!selectedFile ? "empty" : ""}>
            {selectedFile ? (
              <>
                {getFileIcon(selectedFile) && (
                  <img
                    src={getFileIcon(selectedFile)}
                    alt="File type icon"
                    style={{ width: "30px", height: "30px" }}
                  />
                )}
                <p>
                  {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </>
            ) : (
              <p className="">No se ha seleccionado ningún archivo.</p>
            )}
          </div>

          <div id="divModelTranscribe">
            <label htmlFor="selectModel" id="labelModel">
              Seleccionar nivel de precisión:
              <select
                name="selectModel"
                id="selectModel"
                defaultValue="medium"
                ref={selectModelRef}
                className="dark:bg-neutral-900"
              >
                <option value="small">Bajo</option>
                <option value="medium">Medio</option>
                <option value="large-v3">Alto</option>
              </select>
            </label>
            <button id="btnTranscribir" onClick={handleTranscribeClick}>
              {isTranscribing ? "Transcribiendo..." : "Transcribir"}
            </button>
          </div>
        </div>

        {/* Sección de Resultado de Transcripción */}
        <div className="resultadoTranscripcion">
          <h3 style={{ textAlign: "left", marginBottom: "5px" }}>
            Resultado de la transcripción:
          </h3>
          <div id="btnsResult">
            {lastTranscriptionData && (
              <>
                <span
                  id="verText"
                  onClick={handleVerTxt}
                  style={{
                    display: "flex",
                    backgroundColor: showTxtView ? "black" : "gray",
                    cursor: "pointer",
                  }}
                >
                  Texto
                </span>
                <span
                  id="verSrt"
                  onClick={handleVerSrt}
                  style={{
                    display: "flex",
                    backgroundColor: !showTxtView ? "black" : "gray",
                    cursor: "pointer",
                  }}
                >
                  Subtítulos
                </span>
              </>
            )}
          </div>
          <div id="resultado">
            {showTxtView ? (
              <p>{transcriptionResultText}</p>
            ) : (
              <div>{segmentsHtml}</div>
            )}
          </div>
          {lastTranscriptionData && (
            <div className="selectFormat" style={{ display: "flex" }}>
              <div>
                <label htmlFor="fileExtension">Formato:</label>
                <select
                  name="extension"
                  id="fileExtension"
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="dark:bg-neutral-900 dark:text-white"
                >
                  <option value="first" disabled>
                    Seleccione formato
                  </option>
                  <option value="txt">.txt</option>
                  <option value="srt">.srt</option>
                </select>
              </div>
              <a
                id="btnDescargarTxt"
                style={{ display: "block" }}
                onClick={handleDownloadClick}
              >
                Descargar Transcripción
              </a>
            </div>
          )}

          <p id="link"></p>
        </div>
      </section>
    </div>
  );
};
