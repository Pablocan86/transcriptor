import { useState } from "react";
import "./App.css";
import { Footer } from "./components/footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Menu } from "./components/Menu";
import { Transcriptor } from "./components/Transcriptor";
import { TextToSpeech } from "./components/TextToSpeech";
import { Header } from "./components/Header";
import Stream from "./components/Stream";
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

function App() {
  return (
    
      <BrowserRouter>
       <Header/>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/transcriptor" element={<Transcriptor />} />
          <Route path="/texttospeech" element={<TextToSpeech />} />
          <Route path="/stream" element={<Stream socket={socket}/>}/>
        </Routes>
        <Footer />
      </BrowserRouter>
   
  );
}

export default App;
