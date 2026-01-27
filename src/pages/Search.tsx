import { useState } from "react";
import { Search as SearchIcon, User, BookOpen, FileText } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Parishioner {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
}

interface Sacrament {
  id: string;
  sacrament_type: string;
  ceremony_date: string;
  church_name: string | null;
  priest_name: string | null;
}

interface SearchResult extends Parishioner {
  sacraments: Sacrament[];
}

const sacramentLabels: Record<string, string> = {
  bautismo: "Bautismo",
  primera_comunion: "Primera Comunión",
  confirmacion: "Confirmación",
  matrimonio: "Matrimonio",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese un DNI o nombre para buscar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Buscar por DNI o nombre
      const { data: parishioners, error } = await supabase
        .from("parishioners")
        .select("*")
        .or(`dni.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);

      if (error) throw error;

      // Obtener sacramentos para cada feligrés
      const resultsWithSacraments: SearchResult[] = await Promise.all(
        (parishioners || []).map(async (parishioner) => {
          const { data: sacraments } = await supabase
            .from("sacraments")
            .select("*")
            .eq("parishioner_id", parishioner.id)
            .order("ceremony_date", { ascending: false });

          return {
            ...parishioner,
            sacraments: sacraments || [],
          };
        })
      );

      setResults(resultsWithSacraments);
    } catch (error) {
      console.error("Error searching:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar. Por favor intente de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <MainLayout title="Buscar Registros">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Search Input */}
        <Card className="card-parish">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Búsqueda de Feligreses</CardTitle>
            <CardDescription>
              Busque por número de DNI o nombre del feligrés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Ingrese DNI o nombre..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 input-parish"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="btn-gold px-6"
              >
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <Card className="card-parish">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    No se encontraron resultados para "{query}"
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Se encontraron {results.length} resultado(s)
                </p>
                {results.map((result) => (
                  <Card key={result.id} className="card-parish animate-slide-up">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="font-serif text-lg">
                              {result.first_name} {result.last_name}
                            </CardTitle>
                            <CardDescription className="font-mono">
                              DNI: {result.dni}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Personal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {result.birth_date && (
                            <div>
                              <span className="text-muted-foreground">Fecha de nacimiento:</span>
                              <p className="font-medium">
                                {new Date(result.birth_date).toLocaleDateString("es-PE")}
                              </p>
                            </div>
                          )}
                          {result.phone && (
                            <div>
                              <span className="text-muted-foreground">Teléfono:</span>
                              <p className="font-medium">{result.phone}</p>
                            </div>
                          )}
                          {result.address && (
                            <div>
                              <span className="text-muted-foreground">Dirección:</span>
                              <p className="font-medium">{result.address}</p>
                            </div>
                          )}
                        </div>

                        {/* Sacraments */}
                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Sacramentos Recibidos</span>
                          </div>
                          {result.sacraments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No hay sacramentos registrados
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {result.sacraments.map((sacrament) => (
                                <Badge
                                  key={sacrament.id}
                                  className={`sacrament-badge sacrament-${sacrament.sacrament_type}`}
                                >
                                  {sacramentLabels[sacrament.sacrament_type] || sacrament.sacrament_type}
                                  <span className="ml-2 opacity-70">
                                    {new Date(sacrament.ceremony_date).toLocaleDateString("es-PE")}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
