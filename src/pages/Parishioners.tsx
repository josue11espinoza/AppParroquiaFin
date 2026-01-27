import { useState, useEffect } from "react";
import { Plus, User, Pencil, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  created_at: string;
}

export default function ParishionersPage() {
  const [parishioners, setParishioners] = useState<Parishioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParishioner, setEditingParishioner] = useState<Parishioner | null>(null);
  const [formData, setFormData] = useState({
    dni: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    phone: "",
    address: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchParishioners();
  }, []);

  const fetchParishioners = async () => {
    try {
      const { data, error } = await supabase
        .from("parishioners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setParishioners(data || []);
    } catch (error) {
      console.error("Error fetching parishioners:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los feligreses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dni || !formData.first_name || !formData.last_name) {
      toast({
        title: "Error",
        description: "DNI, nombre y apellido son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingParishioner) {
        const { error } = await supabase
          .from("parishioners")
          .update({
            dni: formData.dni,
            first_name: formData.first_name,
            last_name: formData.last_name,
            birth_date: formData.birth_date || null,
            phone: formData.phone || null,
            address: formData.address || null,
          })
          .eq("id", editingParishioner.id);

        if (error) throw error;
        toast({ title: "Éxito", description: "Feligrés actualizado correctamente" });
      } else {
        const { error } = await supabase.from("parishioners").insert({
          dni: formData.dni,
          first_name: formData.first_name,
          last_name: formData.last_name,
          birth_date: formData.birth_date || null,
          phone: formData.phone || null,
          address: formData.address || null,
        });

        if (error) throw error;
        toast({ title: "Éxito", description: "Feligrés registrado correctamente" });
      }

      setDialogOpen(false);
      resetForm();
      fetchParishioners();
    } catch (error: any) {
      console.error("Error saving parishioner:", error);
      toast({
        title: "Error",
        description: error.message?.includes("unique") 
          ? "Ya existe un feligrés con ese DNI" 
          : "No se pudo guardar el feligrés",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (parishioner: Parishioner) => {
    setEditingParishioner(parishioner);
    setFormData({
      dni: parishioner.dni,
      first_name: parishioner.first_name,
      last_name: parishioner.last_name,
      birth_date: parishioner.birth_date || "",
      phone: parishioner.phone || "",
      address: parishioner.address || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este feligrés?")) return;

    try {
      const { error } = await supabase.from("parishioners").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Feligrés eliminado" });
      fetchParishioners();
    } catch (error) {
      console.error("Error deleting parishioner:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el feligrés",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingParishioner(null);
    setFormData({
      dni: "",
      first_name: "",
      last_name: "",
      birth_date: "",
      phone: "",
      address: "",
    });
  };

  return (
    <MainLayout title="Feligreses">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Gestión de los feligreses de la parroquia
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Feligrés
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingParishioner ? "Editar Feligrés" : "Nuevo Feligrés"}
                  </DialogTitle>
                  <DialogDescription>
                    Complete los datos del feligrés
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI *</Label>
                      <Input
                        id="dni"
                        value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        placeholder="12345678"
                        className="input-parish"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        className="input-parish"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nombres *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Juan Carlos"
                        className="input-parish"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Apellidos *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="García López"
                        className="input-parish"
                      />
                    </div>
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
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Av. Principal 123"
                      className="input-parish"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="btn-gold">
                    {editingParishioner ? "Actualizar" : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card className="card-parish">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Cargando...
              </div>
            ) : parishioners.length === 0 ? (
              <div className="p-8 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No hay feligreses registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DNI</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Fecha Nac.</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parishioners.map((parishioner) => (
                    <TableRow key={parishioner.id}>
                      <TableCell className="font-mono">{parishioner.dni}</TableCell>
                      <TableCell className="font-medium">
                        {parishioner.first_name} {parishioner.last_name}
                      </TableCell>
                      <TableCell>
                        {parishioner.birth_date
                          ? new Date(parishioner.birth_date).toLocaleDateString("es-PE")
                          : "—"}
                      </TableCell>
                      <TableCell>{parishioner.phone || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(parishioner)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(parishioner.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
