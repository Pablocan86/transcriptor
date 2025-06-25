import React from "react";
import { Form, Link } from "react-router-dom";
import { useState, useCallback } from "react";
import Swal from "sweetalert2";

export const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [visible, setVisible] = useState(false);
  const [audioPlay, setAudioPlay] = useState("");

  const handleTextChange = useCallback((e) => {
    setText(e.target.value);
  });

  const handleLanguage = (e) => {
    const language = e.target.value;
    setSelectedLanguage(language);
  };

  const handlGenerarAudio = async () => {
    const formData = new FormData();
    if (text === "") {
      Swal.fire({
        title: "Error!",
        text: "Debe escribir un texto",
        icon: "error",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    setVisible(true);
    try {
      const response = await fetch("http://5.5.4.39:5001/api/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          language: selectedLanguage,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        setAudioPlay(URL.createObjectURL(blob));

        Swal.fire({
          text: "Audio creado listo para descargar.",
          icon: "success",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        });
      } else {
        const errorData = await response.json();
        console.error("Error al sintetizar voz:", errorData.message);
        alert(
          "Error al sintetizar voz: " +
            (errorData.message || "Ocurrió un error desconocido.")
        );
      }
      console.log(response);
    } catch (error) {
      console.error("Error de red o desconocido:", error);
      alert("Ocurrió un error inesperado al conectar con el servidor.");
    } finally {
      setVisible(false);
    }
  };

  return (
    <div className="flex flex-col items-center  min-h-[75vh] dark:bg-neutral-800">
      <h2 className="text-2xl font-semibold pt-5 dark:text-white">
        CONVERSOR TEXTO A VOZ
      </h2>
      <section
        id="textToSpeechSection"
        className="bg-[#ffffff] dark:bg-neutral-900"
      >
        <textarea
          name="text"
          id="textToSpeech"
          cols="10"
          rows="10"
          placeholder="Escribe el texto a convertir en voz..."
          onInput={handleTextChange}
          className="bg-[#ede9e9] text-black dark:bg-neutral-600 dark:text-white"
        ></textarea>
        <div id="languageSelection">
          <label
            htmlFor="selectLanguage"
            id="labelLanguage"
            className=" dark:text-white"
          >
            Selecciona el idioma:
            <select
              name="language"
              id="selectLanguage"
              defaultValue="es"
              onChange={handleLanguage}
              className="dark:bg-neutral-900 dark:text-white"
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="it">Italiano</option>
            </select>
          </label>

          <button
            id="btnCrearAudio"
            onClick={handlGenerarAudio}
            disabled={visible ? true : false}
          >
            {visible ? "Creando audio..." : "Crear"}
          </button>
        </div>
        <div
          id="audioControls"
          className="w-full flex flex-col items-center justify-center"
          style={audioPlay === "" ? { display: "none" } : { display: "block" }}
        >
          <h3>Audio Generado:</h3>

          <audio
            id="audioPlayer"
            controls
            src={audioPlay === "" ? null : audioPlay}
          ></audio>
        </div>
      </section>
    </div>
  );
};
