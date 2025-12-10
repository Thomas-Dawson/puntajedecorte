import React from "react";
import { Link } from "react-router-dom";

const InstagramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className="w-6 h-6 inline-block mr-2"
  >
    <rect x={2} y={2} width={20} height={20} rx={5} ry={5} />
    <path d="M16 11.37a4 4 0 11-4.73-4.73 4 4 0 014.73 4.73z" />
    <line x1={17.5} y1={6.5} x2={17.5} y2={6.5} />
  </svg>
);

const Creditos = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 max-w-xl mx-auto">
    <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center w-full">Créditos</h1>

    <p className="mb-4 text-justify w-full max-w-full">
      <strong>Fuente de datos:</strong>{" "}
      Datos abiertos{" "}
      <a
        href="https://demre.cl/portales/portal-bases-datos"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        DEMRE
      </a>
      {""}, años 2004–2025.
    </p>

    <p className="mb-4 text-justify w-full max-w-full">
      <strong>Uso de los datos:</strong> Los datos publicados en esta página provienen de bases de datos públicas del DEMRE. Estos datos son anonimizados y se utilizan exclusivamente para fines de análisis e investigación.
    </p>

    <p className="mb-4 text-justify w-full max-w-full">
      <strong>Limitaciones y responsabilidad:</strong> La información aquí presentada no debe usarse para identificar a personas ni para evaluar la calidad de la educación o de establecimientos educacionales. Las pruebas de admisión tienen como único fin la participación en el proceso de admisión universitaria chileno. Por lo tanto, cualquier interpretación o uso distinto al establecido es inapropiado.
    </p>

    <p className="mb-4 text-justify w-full max-w-full">
      Esta página no se hace responsable por interpretaciones erróneas o usos indebidos de los datos.
    </p>

    <a
      href="https://www.instagram.com/tdawsonb_/"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 flex items-center text-blue-600 hover:underline"
    >
      <InstagramIcon />
      <span>Sígueme en Instagram</span>
    </a>

    <Link to="/" className="mt-8 text-blue-600 hover:underline self-center">
      Volver al formulario
    </Link>
  </div>
);

export default Creditos;
