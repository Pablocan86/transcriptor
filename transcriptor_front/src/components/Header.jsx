import React from "react";
import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="">
      <h1>HERRAMIENTAS DE IA</h1>
      <Link to="/">
        <FaHome size={25} />
      </Link>
    </header>
  );
};
