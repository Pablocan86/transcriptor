const themeToggle = document.getElementById('themeToggle');
const body = document.body; // O document.documentElement para el <html>

// Cargar la preferencia guardada (si existe)
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  body.classList.add(savedTheme); // Añade 'dark-mode' o lo que se haya guardado
} else {
  // Opcional: Detectar la preferencia del sistema operativo
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    body.classList.add('dark-mode');
  }
}

themeToggle.addEventListener('click', () => {
  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light-mode'); // Guarda la preferencia
  } else {
    body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark-mode'); // Guarda la preferencia
  }
});

const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('audioInput');
const openFileButton = document.getElementById('openFileButton');
const fileListContainer = document.getElementById('file-list');
const fileExtensionSelect = document.getElementById('fileExtension'); // Select para elegir TXT/SRT
const btnTranscribir = document.getElementById('btnTranscribir');
const resultadoP = document.getElementById('resultado');
const btnDescargarTxt = document.getElementById('btnDescargarTxt');
const selectFormat = document.querySelector('.selectFormat');
const linkParrafo = document.getElementById('link');
const selectModel = document.querySelector('#selectModel');

//Botones para cambiar de txt a srt en resultado de transcripción
const verTxt = document.querySelector('#verText');
const verSrt = document.querySelector('#verSrt');

// Elementos de la barra de progreso
const loadingOverlay = document.getElementById('loadingOverlay');
const textProcess = document.querySelector('#textProcess');
const progressBar = document.getElementById('progressBar');
const loadingText = document.getElementById('loadingText');
const avisoProgress = document.getElementById('avisoProgress');

let selectedFile = null; // Variable central para almacenar el único archivo seleccionado
let lastTranscriptionData = null; // Renombrado de lastTranscriptionResult
let processingTextInterval = null;

let existFile = false; // Variable para verificar si existe un archivo
// Función para mostrar el archivo
function displaySelectedFile() {
  fileListContainer.innerHTML = '';
  if (selectedFile === null) {
    fileListContainer.classList.add('empty');
    fileListContainer.innerHTML =
      '<p>No se ha seleccionado ningún archivo.</p>';
    // btnTranscribir.disabled = true;
    btnDescargarTxt.style.display = 'none'; // Ocultar botón de descarga
    selectFormat.style.display = 'none';
    resultadoP.textContent = '';
    linkParrafo.innerHTML = '';
    return;
  }
  fileListContainer.classList.remove('empty');
  const fileItem = document.createElement('p');
  let image = document.createElement('img');
  image.style.width = '30px';
  image.style.height = '30px';
  if (
    selectedFile.type === 'audio/mpeg' ||
    selectedFile.type === 'audio/wav' ||
    selectedFile.type === 'audio/webm' ||
    selectedFile.type === 'audio/flac' ||
    selectedFile.type === 'audio/mp3' ||
    selectedFile.type === 'audio/ogg'
  ) {
    (image.src = './assets/images/audio.svg'),
      fileListContainer.appendChild(image);
  } else {
    (image.src = './assets/images/video.svg'),
      fileListContainer.appendChild(image);
  }

  fileItem.textContent = `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`;

  fileListContainer.appendChild(fileItem);
  btnTranscribir.disabled = false;
}

// Inicializar la lista y el estado del botón al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  displaySelectedFile();
  btnDescargarTxt.style.display = 'none';
  selectFormat.style.display = 'none';
  resultadoP.textContent = '';
});

// Función de validación de tipo de archivo
function isValidAudioVideo(file) {
  const acceptedTypes = [
    'audio/mpeg',
    'video/mp4',
    'audio/wav',
    'audio/webm',
    'audio/flac',
    'audio/mp3',
    'audio/ogg',
  ];
  return acceptedTypes.includes(file.type);
}

// 1. Manejar el clic en el botón "Abrir Archivo"
if (openFileButton) {
  openFileButton.addEventListener('click', () => {
    fileInput.click();
  });
}

// 2. Manejar la selección de archivos a través del input oculto (change event)
fileInput.addEventListener('change', (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    existFile = true;
    const file = files[0];

    if (!isValidAudioVideo(file)) {
      Swal.fire({
        title: 'Error!',
        text: 'Debe ser un archivo de audio o video válido (mp3, mp4, wav, etc.)',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6',
      });
      selectedFile = null;
      event.target.value = '';
      displaySelectedFile();
      return;
    }
    selectedFile = file;
  } else {
    selectedFile = null;
  }
  displaySelectedFile();
  event.target.value = '';
});

// 3. Manejar eventos de arrastrar y soltar
['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    () => dropArea.classList.add('highlight'),
    false,
  );
});

['dragleave', 'drop'].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    () => dropArea.classList.remove('highlight'),
    false,
  );
});

dropArea.addEventListener(
  'drop',
  (event) => {
    const dt = event.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];
      if (!isValidAudioVideo(file)) {
        Swal.fire({
          title: 'Error!',
          text: 'Debe ser un archivo de audio o video válido (mp3, mp4, wav, etc.)',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6',
        });
        selectedFile = null;
        displaySelectedFile();
        return;
      }
      selectedFile = file;
    } else {
      selectedFile = null;
    }
    displaySelectedFile();
  },
  false,
);

let segmentsDiv = document.createElement('div');
let displayTranscriptionText;

// 4. Manejar el clic en el botón "Transcribir"
btnTranscribir.addEventListener('click', () => {
  if (existFile === false) {
    Swal.fire({
      title: 'Atención',
      text: 'Debe subir un archivo de audio o video',
      icon: 'warning',
      iconColor: 'red',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
    return;
  }
  segmentsDiv.innerHTML = '';
  uploadAndTranscribe(selectedFile);
});

verTxt.addEventListener('click', () => {
  resultadoP.innerHTML = '';
  resultadoP.textContent = displayTranscriptionText;
  verTxt.style.backgroundColor = 'black';
  verSrt.style.backgroundColor = 'gray';
});

verSrt.addEventListener('click', () => {
  resultadoP.innerHTML = '';
  resultadoP.appendChild(segmentsDiv);
  verTxt.style.backgroundColor = 'gray';
  verSrt.style.backgroundColor = 'black';
});

// 5. Función para subir y transcribir el archivo
async function uploadAndTranscribe(file) {
  // Resetear UI
  loadingText.textContent = 'Iniciando carga...';
  loadingOverlay.style.display = 'flex';
  progressBar.style.width = '0%';
  resultadoP.textContent = '';
  linkParrafo.innerHTML = '';
  btnDescargarTxt.style.display = 'none';
  // selectFormat.style.display = 'none';
  btnTranscribir.disabled = true;
  avisoProgress.textContent =
    'Por favor, no cierre la ventana mientras se procesa la transcripción.';

  const formData = new FormData();
  formData.append('multimedia', file);
  formData.append('modelSize', selectModel.value);


  if (processingTextInterval) {
    clearInterval(processingTextInterval);
    processingTextInterval = null;
  }

  try {
    // --- Fase 1: Subida del Archivo con Progreso Real ---
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        progressBar.style.width = `${percentComplete}%`;
        loadingText.textContent = `Subiendo archivo: ${percentComplete.toFixed(0)}%`;
      }
    });

    const responsePromise = new Promise((resolve, reject) => {
      xhr.open('POST', '/transcribir');
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(
              new Error('Error al parsear la respuesta JSON del servidor.'),
            );
          }
        } else {
          let errorText = 'Error desconocido del servidor.';
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
        reject(new Error('Error de red al intentar conectar con el servidor.'));
      };

      xhr.send(formData);
    });

    // --- Transición a Fase 2: Procesamiento (Transcriptor) ---
    // Una vez que la subida termina (xhr.onload), la barra se completa
    // y el texto cambia para indicar la fase de procesamiento.
    // Aquí puedes reiniciar la barra de progreso para la fase de transcripción o simplemente
    // mantenerla al 100% y cambiar el texto. Para simplicidad, la mantendremos al 100%.
    progressBar.style.width = '100%';
    loadingText.textContent = 'Archivo subido. Procesando transcripción...';

    // Simulación para la fase de transcripción si no hay progreso real del backend
    // Puedes poner un pequeño delay o un progreso simulado en esta fase si el proceso es largo
    let transcriptionProgress = 0;
    const transcriptionInterval = setInterval(() => {
      if (transcriptionProgress < 95) {
        // Simula hasta el 95% para dejar el salto final
        transcriptionProgress += 2;
        // Si quieres que la barra retroceda y reinicie para esta fase:
        progressBar.style.width = `${transcriptionProgress * 1 + 1}%`; // Del 50% al 100%
        loadingText.textContent = `Transcribiendo... `;
      }
    }, 1000); // Actualiza cada segundo

    const data = await responsePromise; // Espera la respuesta completa del backend

    // Cuando la respuesta llega, detenemos la simulación y completamos
    if (processingTextInterval) {
      clearInterval(processingTextInterval);
      processingTextInterval = null;
    }
    clearInterval(transcriptionInterval);
    progressBar.style.width = '100%'; // Asegurarse de que esté al 100%
    loadingText.textContent = 'Transcripción completada.';

    lastTranscriptionData = data; // Almacenamos toda la información

    // --- Mostrar el texto plano en la página ---
    displayTranscriptionText = lastTranscriptionData.full_text;
    let counter = 1;
    lastTranscriptionData.segments.forEach((s) => {
      let p = document.createElement('p');
      p.textContent = `${counter} - [${formatTimeForSrt(s.start)} - ${formatTimeForSrt(s.end)}] : ${s.text}`;
      counter++;
      segmentsDiv.appendChild(p);
    });

    if (
      typeof displayTranscriptionText === 'string' &&
      displayTranscriptionText.length > 0
    ) {
      displayTranscriptionText =
        displayTranscriptionText.charAt(0).toUpperCase() +
        displayTranscriptionText.slice(1);
      if (!displayTranscriptionText.endsWith('.')) {
        displayTranscriptionText += '.';
      }
    }
    resultadoP.textContent = displayTranscriptionText;
    verTxt.style.backgroundColor = 'black';
    verTxt.style.display = 'flex';
    verSrt.style.display = 'flex';

    const element = document.createElement('p');
    element.style.position = 'absolut';

    //Función para poder copiar el texto al portapapeles, es necesario que el navegador tenga habilitado el portapapeles
    //   resultadoP.addEventListener('click', () => {
    //       // Copiar el texto al portapapeles
    //       navigator.clipboard.writeText(displayTranscriptionText).then(() => {
    //           Swal.fire({
    //               title: 'Texto Copiado',
    //               text: 'El texto de la transcripción ha sido copiado al portapapeles.',
    //               icon: 'success',
    //               confirmButtonText: 'Aceptar',
    //               confirmButtonColor: '#3085d6',
    //           });
    //       }).catch(err => {
    //           console.error('Error al copiar el texto:', err);
    //           Swal.fire({
    //               title: 'Error',
    //               text: 'No se pudo copiar el texto al portapapeles.',
    //               icon: 'error',
    //               confirmButtonText: 'Aceptar',
    //               confirmButtonColor: '#3085d6',
    //           });
    //       });
    //   }
    // )

    // Mostrar y configurar el botón de descarga
    btnDescargarTxt.style.display = 'block';
    selectFormat.style.display = 'flex';
  } catch (error) {
    // Asegurarse de limpiar intervalos si hay un error
    // if (uploadInterval) clearInterval(uploadInterval);
    // if (transcriptionInterval) clearInterval(transcriptionInterval); // Si usas un intervalo para transcripción

    console.error('Error al transcribir el audio:', error);
    resultadoP.textContent = `Error: ${error.message}`;
    Swal.fire({
      title: 'Error de Transcripción',
      text: error.message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
  } finally {
    btnTranscribir.textContent = 'Transcribir';
    btnTranscribir.disabled = false;
    setTimeout(() => {
      loadingOverlay.style.display = 'none';
    }, 500);
  }
}

// Manejar la descarga del archivo de transcripción
btnDescargarTxt.addEventListener('click', (event) => {
  // Verificar si hay datos de transcripción disponibles
  if (
    !lastTranscriptionData ||
    (!lastTranscriptionData.full_text &&
      (!lastTranscriptionData.segments ||
        lastTranscriptionData.segments.length === 0))
  ) {
    Swal.fire({
      title: 'Atención',
      text: 'No hay transcripción disponible para descargar.',
      icon: 'warning',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
    event.preventDefault();
    return;
  }

  const selectedFormat = fileExtensionSelect.value;

  let contentToDownload = '';
  let filename = 'transcripcion_resultado';

  if (selectedFormat === 'txt') {
    if (lastTranscriptionData.full_text) {
      contentToDownload = lastTranscriptionData.full_text;
    } else {
      // Fallback si por alguna razón no hay full_text pero sí segmentos
      contentToDownload = (lastTranscriptionData.segments || [])
        .map((segment) => segment.text)
        .join('\n');
    }
    filename += '.txt';
  } else if (selectedFormat === 'srt') {
    if (
      lastTranscriptionData.segments &&
      Array.isArray(lastTranscriptionData.segments) &&
      lastTranscriptionData.segments.length > 0
    ) {
      let srtContent = '';
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
      filename += '.srt';
    } else {
      Swal.fire({
        title: 'Atención',
        text: 'No hay datos de segmento disponibles para generar el archivo SRT.',
        icon: 'warning',
        iconColor: 'red',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6',
      });
      event.preventDefault();
      return;
    }
  } else {
    Swal.fire({
      title: 'Error',
      text: 'Formato de descarga no válido. Seleccione TXT o SRT.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
    event.preventDefault();
    return;
  }

  const blob = new Blob([contentToDownload], {
    type: `text/${selectedFormat};charset=utf-8`,
  });
  const url = URL.createObjectURL(blob);

  // Configurar el enlace de descarga directamente en el botón existente
  btnDescargarTxt.href = url;
  btnDescargarTxt.download = filename;

  // Solo necesitamos asegurar la limpieza de la URL.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
});

// Función auxiliar para formatear tiempo a HH:MM:SS,ms para SRT
function formatTimeForSrt(seconds) {
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const ms = Math.floor(
    (remainingSeconds - Math.floor(remainingSeconds)) * 1000,
  );
  const s = Math.floor(remainingSeconds);

  return (
    [hours, minutes, s].map((n) => n.toString().padStart(2, '0')).join(':') +
    ',' +
    ms.toString().padStart(3, '0')
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const textToSpeech = document.getElementById('textToSpeech');
  const selectLanguage = document.getElementById('selectLanguage');
  const btnCrearAudio = document.getElementById('btnCrearAudio');
  const audioControls = document.getElementById('audioControls');
  const audioPlayer = document.getElementById('audioPlayer');
  // const btnDownloadAudio = document.getElementById('btnDownloadAudio');
  // const btnPlayAudio = document.getElementById('btnPlayAudio'); //

  btnCrearAudio.addEventListener('click', synthesizeSpeech);

  async function synthesizeSpeech() {
    const text = textToSpeech.value;
    const language = selectLanguage.value;

    if (!text.trim()) {
      Swal.fire({
        text: 'Por favor, ingresa el texto que deseas convertir en voz.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    btnCrearAudio.disabled = true;
    btnCrearAudio.textContent = 'Generando audio...';
    audioControls.style.display = 'none';
    audioPlayer.src = '';

    try {
      const response = await fetch('/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: language,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);

        // Configura el reproductor de audio
        audioPlayer.src = audioUrl;
        audioControls.style.display = 'block'; // Muestra los controles

        // // Configura el botón de descarga
        // btnDownloadAudio.onclick = () => {
        //     const a = document.createElement('a');
        //     a.href = audioUrl;
        //     // Sugiere un nombre de archivo para la descarga
        //     a.download = `audio_sintetizado_${Date.now()}.mp3`;
        //     document.body.appendChild(a);
        //     a.click();
        //     a.remove();
        //     // No revocamos el URL del objeto aquí, porque el reproductor lo sigue usando
        // };

        // Si mantienes el botón de Reproducir (redundante con controls)
        // btnPlayAudio.onclick = () => {
        //     audioPlayer.play().catch(e => console.error("Error al reproducir audio:", e));
        // };

        // console.log('Audio generado y listo para reproducir/descargar.');
        Swal.fire({
          text: 'Audio creado listo para descargar.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6',
        });
      } else {
        const errorData = await response.json();
        console.error('Error al sintetizar voz:', errorData.message);
        alert(
          'Error al sintetizar voz: ' +
            (errorData.message || 'Ocurrió un error desconocido.'),
        );
      }
    } catch (error) {
      console.error('Error de red o desconocido:', error);
      alert('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      btnCrearAudio.disabled = false; // Habilita el botón de nuevo
      btnCrearAudio.textContent = 'Generar audio';
    }
  }
});
