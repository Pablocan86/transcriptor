import React from "react";

export const Card = ({ titulo, imagen, alt, descripcion, classH3 }) => {
  return (
    <div className="flex flex-col items-center justify-between shadow-2xl rounded-2xl  w-90 md:w-100 h-100 duration-600 transition-all  hover:bg-gray-500 cursor-pointer  hover:text-white hover:scale-101">
      <h3 className={classH3}>{titulo}</h3>
      <img className="w-30 h-30" src={imagen} alt={alt} />
      <p className="pb-3">{descripcion}</p>
    </div>
  );
};
