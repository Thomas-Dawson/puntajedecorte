import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";


const API_URL = import.meta.env.VITE_API_URL || '/api'; 

// Años del 2004 al 2025 (Calculados dinámicamente)
const years = Array.from({ length: 2025 - 2004 + 1 }, (_, i) => (2004 + i).toString()).reverse();

const ConsultaForm = () => {
  const [selectedYear, setSelectedYear] = useState<string | undefined>();
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>();
  const [selectedCareer, setSelectedCareer] = useState<string | undefined>();
  
  const [universities, setUniversities] = useState<string[]>([]);
  const [careers, setCareers] = useState<string[]>([]);
  // Nuevo estado para guardar el mapa de carreras y no llamar a la API dos veces
  const [carrerasMap, setCarrerasMap] = useState<Record<string, string[]>>({}); 
  
  const [results, setResults] = useState<any | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false); // Carga inicial
  const [isSubmitting, setIsSubmitting] = useState(false); // Carga de búsqueda
  const { toast } = useToast();

  // 1. Cuando cambia el año, cargamos Universidades y el Mapa de Carreras
  useEffect(() => {
    if (selectedYear) {
      fetchOptions(selectedYear);
    }
  }, [selectedYear]);

  // 2. Cuando cambia la universidad, actualizamos la lista de carreras desde la memoria local
  useEffect(() => {
    if (selectedUniversity && carrerasMap[selectedUniversity]) {
      setCareers(carrerasMap[selectedUniversity]);
      setSelectedCareer(undefined); // Resetear carrera seleccionada
    } else {
      setCareers([]);
    }
  }, [selectedUniversity, carrerasMap]);

  const fetchOptions = async (year: string) => {
    setIsLoadingOptions(true);
    setUniversities([]);
    setSelectedUniversity(undefined);
    setCareers([]);
    setSelectedCareer(undefined);
    setResults(null);
    
    try {
      // Usamos la ruta relativa /api para que Vite lo redirija al puerto 5000
      const response = await fetch(`${API_URL}/opciones/${year}`);
      if (!response.ok) {
        throw new Error('Error al conectar con el servidor');
      }
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      setUniversities(data.universidades);
      setCarrerasMap(data.carreras_por_universidad); // Guardamos el mapa

    } catch (error) {
      console.error('Error fetching options:', error);
      toast({
        title: 'Error de conexión',
        description: 'No se pudieron cargar los datos. Asegúrate de que el backend (app.py) esté corriendo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleConsultar = async () => {
    if (!(selectedYear && selectedUniversity && selectedCareer)) {
      toast({
        title: "Faltan datos",
        description: "Por favor selecciona año, universidad y carrera",
      });
      return;
    }

    setIsSubmitting(true);
    setResults(null);
    
    try {
      const response = await fetch(`${API_URL}/consultar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,        // Backend espera 'year'
          universidad: selectedUniversity,
          carrera: selectedCareer
        })
      });
      
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }
      
      setResults(data.resultados);

    } catch (error: any) {
      console.error('Error submitting query:', error);
      toast({
        title: 'Error en la búsqueda',
        description: error.message || 'No se pudo procesar la consulta',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center pt-10">
      <main className="w-full max-w-md p-6 space-y-6 bg-card rounded-xl shadow-lg border border-border">
        <h2 className="text-2xl font-bold text-center mb-6">Consulta Puntajes</h2>
        
        <div className="space-y-4">
          {/* SELECCIÓN DE AÑO */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Año de Admisión
            </label>
            <Select onValueChange={(value) => setSelectedYear(value)} value={selectedYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione año..." />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SELECCIÓN DE UNIVERSIDAD */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Universidad
            </label>
            <Select 
              onValueChange={(value) => setSelectedUniversity(value)} 
              value={selectedUniversity}
              disabled={!selectedYear || isLoadingOptions}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingOptions ? "Cargando..." : "Seleccione universidad..."} />
              </SelectTrigger>
              <SelectContent>
                {universities.map((uni) => (
                  <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SELECCIÓN DE CARRERA */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Carrera
            </label>
            <Select 
              onValueChange={(value) => setSelectedCareer(value)} 
              value={selectedCareer}
              disabled={!selectedUniversity}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione carrera..." />
              </SelectTrigger>
              <SelectContent>
                {careers.map((career) => (
                  <SelectItem key={career} value={career}>{career}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleConsultar}
          className="w-full mt-4"
          disabled={isSubmitting || !selectedYear || !selectedUniversity || !selectedCareer}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : "Consultar Puntajes"}
        </Button>

        {/* RESULTADOS */}
        {results && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3 text-center text-primary">Resultados</h3>
              <div className="space-y-4">
                {results.map((item: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-md border text-sm space-y-2">
                     
                     <div className="flex justify-between items-center border-b pb-2 border-border/50">
                        <span className="text-muted-foreground">Código:</span>
                        <span className="font-mono font-bold">{item.codigo_carrera}</span>
                     </div>

                     {item.encontrado ? (
                       <>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Puntaje Mínimo:</span>
                            <span className="font-bold text-green-600 dark:text-green-400 text-lg">{item.puntaje_min}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Puntaje Máximo:</span>
                            <span className="font-bold">{item.puntaje_max}</span>
                         </div>
                         <div className="text-xs text-right text-muted-foreground pt-1 italic">
                           ({item.columna_usada})
                         </div>
                       </>
                     ) : (
                       <div className="text-center text-red-500 py-2 font-medium">
                         {item.mensaje || "Sin datos de puntaje"}
                       </div>
                     )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConsultaForm;