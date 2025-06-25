import { useState, useEffect } from "react";
import "./App.css";
import { Footer } from "./components/footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Menu } from "./components/Menu";
import { Transcriptor } from "./components/Transcriptor";
import { TextToSpeech } from "./components/TextToSpeech";
import { Header } from "./components/Header";
import Stream from "./components/Stream";

function App() {
  const [isDark, setIsDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);
  
  return (
    <BrowserRouter>
      <Header isDark={isDark} onToggleTheme={() => setIsDark(!isDark)}/>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/transcriptor" element={<Transcriptor isDark={isDark} />} />
        <Route path="/texttospeech" element={<TextToSpeech />} />
        <Route path="/stream" element={<Stream />} />
      </Routes>
      <Footer />
    
    </BrowserRouter>
  );
}

export default App;
