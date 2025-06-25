import React, { useState, useEffect } from "react";
import { FaHome, FaSun, FaMoon } from "react-icons/fa";
import { useLocation, Link } from "react-router-dom";

export const Header = ({ isDark, onToggleTheme }) => {
  const [showIcon, setShowIcon] = useState(true);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      setShowIcon(true);
    } else setShowIcon(false);
  }, [location.pathname]);



  return (
    <header className="w-full flex flex-row items-center justify-between p-5 text-white duration-600 bg-[linear-gradient(to_right,#24487c,#6e9ee2)] dark:bg-[linear-gradient(to_right,#070707,#767d86)]">
      <h1 className="text-4xl">HERRAMIENTAS DE IA</h1>
      <div className="flex flex-row items-center justify-center gap-2">
        {!showIcon ? (
          <Link to="/">
            <FaHome size={25} />
          </Link>
        ) : (
          ""
        )}

        <button
          onClick={onToggleTheme}
          className="p-3 hover:opacity-80 dark:text-white"
        >
          {isDark ? (
            <FaSun size={20} title="Modo claro" />
          ) : (
            <FaMoon size={20} title="Modo oscuro" />
          )}
        </button>
      </div>
    </header>
  );
};
