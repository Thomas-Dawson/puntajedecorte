import ConsultaForm from "@/components/ConsultaForm";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-background text-foreground p-4 md:p-8">
      <header className="w-full max-w-3xl text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-bold mb-2">Consulta de Puntaje de Corte</h1>
        <p className="text-muted-foreground">
          Consulte los puntajes de corte, indicando el puntaje mínimo y máximo con los cuales los postulantes fueron admitidos.
        </p>
      </header>

      <main className="w-full max-w-xl">
        <ConsultaForm />
      </main>

      <Link to="/creditos" className="mt-8 text-blue-600 hover:underline">
        Ver créditos
      </Link>
    </div>
  );
};

export default Index;
