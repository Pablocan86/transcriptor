# Proyecto de Transcripción de Audiencias Judiciales

Este proyecto tiene como objetivo principal facilitar la transcripción automática de grabaciones de audiencias judiciales, transformando archivos de audio y video en texto legible.

## 🚀 Descripción del Proyecto

En el ámbito judicial, la transcripción precisa y eficiente de las audiencias es fundamental. Este sistema automatiza gran parte de este proceso, convirtiendo el contenido hablado de las audiencias en texto legible.

Esto permite a los profesionales del derecho:
* Ahorrar tiempo considerable en la elaboración de actas o minutas.
* Realizar búsquedas rápidas dentro del contenido de la audiencia.
* Generar transcripciones en formato de texto plano (`.txt`) o subtítulos con marcas de tiempo (`.srt`).

## ✨ Características Principales

* **Carga de Archivos Flexible:** Permite cargar archivos de audio y video mediante un botón de selección o arrastrando y soltando (`Drag & Drop`).
* **Transmisión de Archivos Grandes:** Capacidad para manejar archivos de audio y video de tamaño considerable para transcripción.
* **Barra de Progreso Dinámica:** Muestra el progreso en tiempo real de la carga del archivo y una fase de procesamiento de la transcripción.
* **Transcripción Automática:** Convierte el habla en texto utilizando modelos avanzados de procesamiento de lenguaje.
* **Generación de Archivos de Salida:**
    * **TXT:** Texto plano con la transcripción completa.
    * **SRT:** Archivo de subtítulos compatible con reproductores de video, que incluye marcas de tiempo precisas para cada segmento.
* **Interfaz de Usuario Intuitiva:** Diseño web sencillo para una fácil interacción.

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido con una arquitectura moderna que combina frontend, backend y procesamiento de IA:

* **Frontend:**
    * **HTML5, CSS3, JavaScript:** Para la interfaz de usuario.
    * **SweetAlert2:** Para notificaciones y alertas amigables.
* **Backend (API):**
    * **NestJS (Node.js):** Framework robusto para construir la API REST que gestiona la carga de archivos y la comunicación con el procesador de IA.
    * **Multer:** Middleware para el manejo de la carga de archivos.
* **Procesamiento de IA (Python):**
    * **Python 3.8+:** Lenguaje de programación para la lógica de transcripción.
    * **Faster-Whisper:** Implementación optimizada del modelo Whisper de OpenAI para transcripción rápida y eficiente.
    * **ONNX Runtime:** Para aceleración de inferencia del modelo.

## ⚙️ Configuración e Instalación

Sigue estos pasos para poner en marcha el proyecto en tu entorno local.

### 1. Requisitos Previos

Asegúrate de tener instalado lo siguiente:

* **Node.js y npm (o yarn):** Para el backend de NestJS y el frontend.
* **Python 3.8+:** Para el procesamiento de IA.
* **Git:** Para clonar el repositorio.
* **NVIDIA GPU (Opcional, pero Altamente Recomendado):** Para un rendimiento significativamente mejor en la transcripción. Si tienes una GPU compatible con CUDA, asegúrate de tener instalados los drivers más recientes y CUDA Toolkit.

### 2. Clonar el Repositorio

```bash
git clone <URL_DEL_TU_REPOSITORIO>
cd <nombre_del_repositorio>
```

# dddd
