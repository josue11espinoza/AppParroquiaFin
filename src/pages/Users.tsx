import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users as UsersIcon, Shield, Church, UserX } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface ProfileWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string | null;
}

export default function Users() {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles-with-roles'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]));

      return profilesData?.map(p => ({
        ...p,
        role: rolesMap.get(p.user_id) || null,
      })) as ProfileWithRole[];
    },
    enabled: isAdmin,
  });

  const { data: priests } = useQuery({
    queryKey: ['priests-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('priests')
        .select('id, name, user_id');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // First, delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as 'admin' | 'priest' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast({ title: 'Rol asignado correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const linkPriestMutation = useMutation({
    mutationFn: async ({ userId, priestId }: { userId: string; priestId: string }) => {
      const { error } = await supabase
        .from('priests')
        .update({ user_id: userId })
        .eq('id', priestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priests-for-linking'] });
      toast({ title: 'Sacerdote vinculado correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast({ title: 'Rol eliminado correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Cargando...</p>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary text-primary-foreground"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'priest':
        return <Badge variant="secondary"><Church className="w-3 h-3 mr-1" />Padre</Badge>;
      default:
        return <Badge variant="outline"><UserX className="w-3 h-3 mr-1" />Sin rol</Badge>;
    }
  };

  const unlinkedPriests = priests?.filter(p => !p.user_id) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra los roles y permisos de los usuarios</p>
        </div>

        <Card className="card-parish">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Usuarios Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Cargando usuarios...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol Actual</TableHead>
                    <TableHead>Asignar Rol</TableHead>
                    <TableHead>Vincular Sacerdote</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.full_name}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>{getRoleBadge(profile.role)}</TableCell>
                      <TableCell>
                        <Select
                          value={selectedRoles[profile.user_id] || ''}
                          onValueChange={(value) => setSelectedRoles(prev => ({ ...prev, [profile.user_id]: value }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="priest">Padre</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {profile.role === 'priest' && unlinkedPriests.length > 0 && (
                          <Select
                            onValueChange={(priestId) => linkPriestMutation.mutate({ userId: profile.user_id, priestId })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Vincular a..." />
                            </SelectTrigger>
                            <SelectContent>
                              {unlinkedPriests.map((priest) => (
                                <SelectItem key={priest.id} value={priest.id}>
                                  {priest.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const role = selectedRoles[profile.user_id];
                            if (role) {
                              assignRoleMutation.mutate({ userId: profile.user_id, role });
                            }
                          }}
                          disabled={!selectedRoles[profile.user_id]}
                        >
                          Asignar
                        </Button>
                        {profile.role && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeRoleMutation.mutate(profile.user_id)}
                          >
                            Quitar Rol
                          </Button>
                        )}
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
