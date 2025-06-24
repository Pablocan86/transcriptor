import React from "react";

export const Card = ({ titulo, imagen, alt, descripcion, classH3 }) => {
  return (
    <div className="flex flex-col items-center justify-between shadow-2xl rounded-2xl  w-90 md:w-100 h-100 hover:bg-gray-500 cursor-pointer hover:text-white">
      <h3 className={classH3}>{titulo}</h3>
      <img className="w-30 h-30" src={imagen} alt={alt} />
      <p>{descripcion}</p>
    </div>
  );
};
