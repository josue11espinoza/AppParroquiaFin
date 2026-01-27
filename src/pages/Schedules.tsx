import { useState, useEffect } from "react";
import { Plus, Calendar, Pencil, Trash2, Clock } from "lucide-react";
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

interface Priest {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  priest_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  activity: string;
  priest?: Priest;
}

const daysOfWeek = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [priests, setPriests] = useState<Priest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    priest_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    activity: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, priestsRes] = await Promise.all([
        supabase
          .from("priest_schedules")
          .select("*, priest:priests(id, name)")
          .order("day_of_week")
          .order("start_time"),
        supabase.from("priests").select("id, name").order("name"),
      ]);

      if (schedulesRes.error) throw schedulesRes.error;
      if (priestsRes.error) throw priestsRes.error;

      setSchedules(schedulesRes.data || []);
      setPriests(priestsRes.data || []);
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

    if (!formData.priest_id || !formData.day_of_week || !formData.start_time || !formData.end_time || !formData.activity) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const scheduleData = {
        priest_id: formData.priest_id,
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        activity: formData.activity,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from("priest_schedules")
          .update(scheduleData)
          .eq("id", editingSchedule.id);

        if (error) throw error;
        toast({ title: "Éxito", description: "Horario actualizado correctamente" });
      } else {
        const { error } = await supabase.from("priest_schedules").insert(scheduleData);

        if (error) throw error;
        toast({ title: "Éxito", description: "Horario registrado correctamente" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el horario",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      priest_id: schedule.priest_id,
      day_of_week: schedule.day_of_week.toString(),
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      activity: schedule.activity,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este horario?")) return;

    try {
      const { error } = await supabase.from("priest_schedules").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Horario eliminado" });
      fetchData();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingSchedule(null);
    setFormData({
      priest_id: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      activity: "",
    });
  };

  // Group schedules by day
  const schedulesByDay = daysOfWeek.map((day) => ({
    ...day,
    schedules: schedules.filter((s) => s.day_of_week === day.value),
  }));

  return (
    <MainLayout title="Horarios">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Gestión de horarios de los sacerdotes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Horario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingSchedule ? "Editar Horario" : "Nuevo Horario"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure el horario del sacerdote
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Sacerdote *</Label>
                    <Select
                      value={formData.priest_id}
                      onValueChange={(value) => setFormData({ ...formData, priest_id: value })}
                    >
                      <SelectTrigger className="input-parish">
                        <SelectValue placeholder="Seleccionar sacerdote" />
                      </SelectTrigger>
                      <SelectContent>
                        {priests.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Día de la Semana *</Label>
                    <Select
                      value={formData.day_of_week}
                      onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                    >
                      <SelectTrigger className="input-parish">
                        <SelectValue placeholder="Seleccionar día" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Hora Inicio *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="input-parish"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Hora Fin *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="input-parish"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity">Actividad *</Label>
                    <Input
                      id="activity"
                      value={formData.activity}
                      onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                      placeholder="Ej: Misa, Confesiones, Catequesis..."
                      className="input-parish"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="btn-gold">
                    {editingSchedule ? "Actualizar" : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Schedule Grid by Day */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : priests.length === 0 ? (
          <Card className="card-parish">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Primero debe registrar sacerdotes para asignar horarios
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schedulesByDay.map((day) => (
              <Card key={day.value} className="card-parish">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {day.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {day.schedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Sin actividades programadas
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {day.schedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-sm font-mono text-primary">
                              <Clock className="w-4 h-4" />
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{schedule.activity}</p>
                              <p className="text-xs text-muted-foreground">
                                {schedule.priest?.name || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(schedule)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(schedule.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
