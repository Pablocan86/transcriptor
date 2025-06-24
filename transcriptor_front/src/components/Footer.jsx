export const Footer = () => {
  return (
    <footer className="w-full pt-5 pb-5 flex flex-row items-center justify-evenly">
      <div className="flex flex-col items-center">
        <p>Desarrollado por Sytec - Oficina de Sistemas y Tecnología</p>
        <p>Secretaría de Informática</p>
        <p>Cámara Nacional de Apelaciones en lo Civil</p>
      </div>

      <div className="logo">
        <img
          src="https://infocivil.pjn.gov.ar/img/logoSytec2.png"
          alt="logo"
          className="w-40"
        />
      </div>
    </footer>
  );
};
