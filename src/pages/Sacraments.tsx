import { useState, useEffect } from "react";
import { Plus, BookOpen, Pencil, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

interface Sacrament {
  id: string;
  parishioner_id: string;
  sacrament_type: string;
  ceremony_date: string;
  church_name: string | null;
  priest_name: string | null;
  godfather_name: string | null;
  godmother_name: string | null;
  book_number: string | null;
  page_number: string | null;
  entry_number: string | null;
  notes: string | null;
  parishioner?: Parishioner;
}

const sacramentTypes = [
  { value: "bautismo", label: "Bautismo" },
  { value: "primera_comunion", label: "Primera Comunión" },
  { value: "confirmacion", label: "Confirmación" },
  { value: "matrimonio", label: "Matrimonio" },
];

const sacramentLabels: Record<string, string> = {
  bautismo: "Bautismo",
  primera_comunion: "Primera Comunión",
  confirmacion: "Confirmación",
  matrimonio: "Matrimonio",
};

export default function SacramentsPage() {
  const [sacraments, setSacraments] = useState<Sacrament[]>([]);
  const [parishioners, setParishioners] = useState<Parishioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSacrament, setEditingSacrament] = useState<Sacrament | null>(null);
  const [formData, setFormData] = useState({
    parishioner_id: "",
    sacrament_type: "",
    ceremony_date: "",
    church_name: "",
    priest_name: "",
    godfather_name: "",
    godmother_name: "",
    book_number: "",
    page_number: "",
    entry_number: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sacramentsRes, parishionersRes] = await Promise.all([
        supabase
          .from("sacraments")
          .select("*, parishioner:parishioners(id, dni, first_name, last_name)")
          .order("ceremony_date", { ascending: false }),
        supabase.from("parishioners").select("id, dni, first_name, last_name").order("last_name"),
      ]);

      if (sacramentsRes.error) throw sacramentsRes.error;
      if (parishionersRes.error) throw parishionersRes.error;

      setSacraments(sacramentsRes.data || []);
      setParishioners(parishionersRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.parishioner_id || !formData.sacrament_type || !formData.ceremony_date) {
      toast({
        title: "Error",
        description: "Feligrés, tipo de sacramento y fecha son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const sacramentData = {
        parishioner_id: formData.parishioner_id,
        sacrament_type: formData.sacrament_type as any,
        ceremony_date: formData.ceremony_date,
        church_name: formData.church_name || null,
        priest_name: formData.priest_name || null,
        godfather_name: formData.godfather_name || null,
        godmother_name: formData.godmother_name || null,
        book_number: formData.book_number || null,
        page_number: formData.page_number || null,
        entry_number: formData.entry_number || null,
        notes: formData.notes || null,
      };

      if (editingSacrament) {
        const { error } = await supabase
          .from("sacraments")
          .update(sacramentData)
          .eq("id", editingSacrament.id);

        if (error) throw error;
        toast({ title: "Éxito", description: "Sacramento actualizado correctamente" });
      } else {
        const { error } = await supabase.from("sacraments").insert(sacramentData);

        if (error) throw error;
        toast({ title: "Éxito", description: "Sacramento registrado correctamente" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving sacrament:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el sacramento",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (sacrament: Sacrament) => {
    setEditingSacrament(sacrament);
    setFormData({
      parishioner_id: sacrament.parishioner_id,
      sacrament_type: sacrament.sacrament_type,
      ceremony_date: sacrament.ceremony_date,
      church_name: sacrament.church_name || "",
      priest_name: sacrament.priest_name || "",
      godfather_name: sacrament.godfather_name || "",
      godmother_name: sacrament.godmother_name || "",
      book_number: sacrament.book_number || "",
      page_number: sacrament.page_number || "",
      entry_number: sacrament.entry_number || "",
      notes: sacrament.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este sacramento?")) return;

    try {
      const { error } = await supabase.from("sacraments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Sacramento eliminado" });
      fetchData();
    } catch (error) {
      console.error("Error deleting sacrament:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el sacramento",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingSacrament(null);
    setFormData({
      parishioner_id: "",
      sacrament_type: "",
      ceremony_date: "",
      church_name: "",
      priest_name: "",
      godfather_name: "",
      godmother_name: "",
      book_number: "",
      page_number: "",
      entry_number: "",
      notes: "",
    });
  };

  return (
    <MainLayout title="Sacramentos">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Registro de bautismos, comuniones, confirmaciones y matrimonios
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Sacramento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingSacrament ? "Editar Sacramento" : "Nuevo Sacramento"}
                  </DialogTitle>
                  <DialogDescription>
                    Complete los datos del sacramento
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Feligrés *</Label>
                      <Select
                        value={formData.parishioner_id}
                        onValueChange={(value) => setFormData({ ...formData, parishioner_id: value })}
                      >
                        <SelectTrigger className="input-parish">
                          <SelectValue placeholder="Seleccionar feligrés" />
                        </SelectTrigger>
                        <SelectContent>
                          {parishioners.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.first_name} {p.last_name} ({p.dni})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Sacramento *</Label>
                      <Select
                        value={formData.sacrament_type}
                        onValueChange={(value) => setFormData({ ...formData, sacrament_type: value })}
                      >
                        <SelectTrigger className="input-parish">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {sacramentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ceremony_date">Fecha de Ceremonia *</Label>
                      <Input
                        id="ceremony_date"
                        type="date"
                        value={formData.ceremony_date}
                        onChange={(e) => setFormData({ ...formData, ceremony_date: e.target.value })}
                        className="input-parish"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="church_name">Iglesia</Label>
                      <Input
                        id="church_name"
                        value={formData.church_name}
                        onChange={(e) => setFormData({ ...formData, church_name: e.target.value })}
                        placeholder="Nombre de la iglesia"
                        className="input-parish"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priest_name">Sacerdote</Label>
                      <Input
                        id="priest_name"
                        value={formData.priest_name}
                        onChange={(e) => setFormData({ ...formData, priest_name: e.target.value })}
                        placeholder="Nombre del sacerdote"
                        className="input-parish"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="godfather_name">Padrino</Label>
                      <Input
                        id="godfather_name"
                        value={formData.godfather_name}
                        onChange={(e) => setFormData({ ...formData, godfather_name: e.target.value })}
                        placeholder="Nombre del padrino"
                        className="input-parish"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="godmother_name">Madrina</Label>
                      <Input
                        id="godmother_name"
                        value={formData.godmother_name}
                        onChange={(e) => setFormData({ ...formData, godmother_name: e.target.value })}
                        placeholder="Nombre de la madrina"
                        className="input-parish"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="book_number">Nº Libro</Label>
                      <Input
                        id="book_number"
                        value={formData.book_number}
                        onChange={(e) => setFormData({ ...formData, book_number: e.target.value })}
                        placeholder="Ej: 5"
                        className="input-parish"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="page_number">Nº Folio</Label>
                      <Input
                        id="page_number"
                        value={formData.page_number}
                        onChange={(e) => setFormData({ ...formData, page_number: e.target.value })}
                        placeholder="Ej: 123"
                        className="input-parish"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entry_number">Nº Partida</Label>
                      <Input
                        id="entry_number"
                        value={formData.entry_number}
                        onChange={(e) => setFormData({ ...formData, entry_number: e.target.value })}
                        placeholder="Ej: 456"
                        className="input-parish"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Observaciones adicionales..."
                      className="input-parish"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="btn-gold">
                    {editingSacrament ? "Actualizar" : "Guardar"}
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
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : sacraments.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No hay sacramentos registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feligrés</TableHead>
                    <TableHead>Sacramento</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Iglesia</TableHead>
                    <TableHead>Libro/Folio/Partida</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sacraments.map((sacrament) => (
                    <TableRow key={sacrament.id}>
                      <TableCell className="font-medium">
                        {sacrament.parishioner
                          ? `${sacrament.parishioner.first_name} ${sacrament.parishioner.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`sacrament-badge sacrament-${sacrament.sacrament_type}`}>
                          {sacramentLabels[sacrament.sacrament_type] || sacrament.sacrament_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(sacrament.ceremony_date).toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell>{sacrament.church_name || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {[sacrament.book_number, sacrament.page_number, sacrament.entry_number]
                          .filter(Boolean)
                          .join("/") || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(sacrament)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(sacrament.id)}
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
