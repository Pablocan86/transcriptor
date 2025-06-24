import React from "react";
import { Card } from "./Card";
import { Link } from "react-router-dom";

export const Menu = () => {
  return (
    <div className="w-full flex flex-col pt-2 md:flex-row items-center justify-around gap-5 m-auto min-h-[70vh]">
      <Link to="/transcriptor" >
        <Card
        classH3="w-full bg-[#007bff] text-white text-center p-2 rounded-t-lg"
          titulo="TRANSCRIPTOR"
          imagen="https://play-lh.googleusercontent.com/P5r7DhKwGv-zPzo25BEeK1FTHHSI75XL4nN0OjqZaMCq2dM0pMT7CIbRiYAGvEXkxsAo"
          alt="caricatura que respresnta la transcripción"
          descripcion={"Transcribe audio/video a texto/srt"}
        />
      </Link>
      <Link to="/texttospeech" >
        <Card
        classH3="w-full bg-[#007bff] text-white text-center p-2 rounded-t-lg"
          titulo="NARRADOR"
          imagen="https://play-lh.googleusercontent.com/4l37HAsK0QR5EI3ioAMZbhU_vCVoXBH41fVhwhPvxPdQ8nO2hB8ye1_gtgKkaED-yjpG=w240-h480-rw"
          alt="caricatura que respresnta la transcripción"
          descripcion={"Crea audios de voz desde texto"}
        />
      </Link>
      {/* <Link to="/stream" >
        <Card
        classH3="w-full bg-[#007bff] text-white text-center p-2 rounded-t-lg"
          titulo="STREAM"
           imagen="https://play-lh.googleusercontent.com/P5r7DhKwGv-zPzo25BEeK1FTHHSI75XL4nN0OjqZaMCq2dM0pMT7CIbRiYAGvEXkxsAo"
          alt="caricatura que respresnta la transcripción"
          descripcion={"Transcribe en vivo"}
        />
      </Link> */}
    </div>
  );
};
