import { useState, useEffect } from "react";
import { Plus, Church, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Priest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  created_at: string;
}

export default function PriestsPage() {
  const [priests, setPriests] = useState<Priest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPriest, setEditingPriest] = useState<Priest | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPriests();
  }, []);

  const fetchPriests = async () => {
    try {
      const { data, error } = await supabase
        .from("priests")
        .select("*")
        .order("name");

      if (error) throw error;
      setPriests(data || []);
    } catch (error) {
      console.error("Error fetching priests:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los sacerdotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPriest) {
        const { error } = await supabase
          .from("priests")
          .update({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
          })
          .eq("id", editingPriest.id);

        if (error) throw error;
        toast({ title: "Éxito", description: "Sacerdote actualizado correctamente" });
      } else {
        const { error } = await supabase.from("priests").insert({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
        });

        if (error) throw error;
        toast({ title: "Éxito", description: "Sacerdote registrado correctamente" });
      }

      setDialogOpen(false);
      resetForm();
      fetchPriests();
    } catch (error) {
      console.error("Error saving priest:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el sacerdote",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (priest: Priest) => {
    setEditingPriest(priest);
    setFormData({
      name: priest.name,
      phone: priest.phone || "",
      email: priest.email || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este sacerdote?")) return;

    try {
      const { error } = await supabase.from("priests").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Sacerdote eliminado" });
      fetchPriests();
    } catch (error) {
      console.error("Error deleting priest:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el sacerdote",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPriest(null);
    setFormData({ name: "", phone: "", email: "" });
  };

  return (
    <MainLayout title="Sacerdotes">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Gestión de los sacerdotes de la parroquia
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Sacerdote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingPriest ? "Editar Sacerdote" : "Nuevo Sacerdote"}
                  </DialogTitle>
                  <DialogDescription>
                    Complete los datos del sacerdote
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="P. Juan Carlos García"
                      className="input-parish"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="987654321"
                      className="input-parish"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="padre@parroquia.com"
                      className="input-parish"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="btn-gold">
                    {editingPriest ? "Actualizar" : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : priests.length === 0 ? (
          <Card className="card-parish">
            <CardContent className="py-12 text-center">
              <Church className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay sacerdotes registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priests.map((priest) => (
              <Card key={priest.id} className="card-parish">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
                        <Church className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="font-serif text-lg">{priest.name}</CardTitle>
                        <CardDescription>Sacerdote</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(priest)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(priest.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {priest.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{priest.phone}</span>
                      </div>
                    )}
                    {priest.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{priest.email}</span>
                      </div>
                    )}
                    {!priest.phone && !priest.email && (
                      <p className="text-muted-foreground italic">Sin información de contacto</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
