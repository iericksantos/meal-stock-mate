import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users as UsersIcon, Trash2, Shield, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: 'admin' | 'staff';
  full_name: string;
}

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'staff' as 'admin' | 'staff',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get all user_roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Combine data
      const usersData: UserWithRole[] = (roles || []).map((role) => {
        const profile = profiles?.find((p) => p.user_id === role.user_id);
        return {
          id: role.user_id,
          email: profile?.full_name || 'Sem email',
          created_at: profile?.created_at || new Date().toISOString(),
          role: role.role as 'admin' | 'staff',
          full_name: profile?.full_name || 'Sem nome',
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast({
        title: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    if (newUser.password.length < 6) {
      toast({
        title: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User not created');

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        full_name: newUser.full_name,
      });

      if (profileError) throw profileError;

      // Create role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: newUser.role,
      });

      if (roleError) throw roleError;

      toast({ title: 'Usuário criado com sucesso!' });
      setNewUser({ email: '', password: '', full_name: '', role: 'staff' });
      setModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('already registered')) {
        toast({
          title: 'Este email já está cadastrado',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar usuário',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: 'Você não pode excluir seu próprio usuário',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      // Delete role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({ title: 'Usuário removido!' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro ao excluir usuário',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Usuários</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie os usuários da sua operação
            </p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    placeholder="João da Silva"
                    value={newUser.full_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, full_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@email.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de usuário</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: 'admin' | 'staff') =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Staff - Pode preencher estoque
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin - Acesso completo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateUser}
                  disabled={creating}
                >
                  {creating ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhum usuário</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Adicione usuários para gerenciar o estoque.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold">Cadastrado em</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u, index) => (
                      <TableRow
                        key={u.id}
                        className={index % 2 === 1 ? 'bg-table-row-alt' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium uppercase text-primary">
                              {u.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{u.full_name}</p>
                              {u.id === user?.id && (
                                <span className="text-xs text-muted-foreground">(você)</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.role === 'admin' ? 'default' : 'secondary'}
                          >
                            {u.role === 'admin' ? (
                              <Shield className="mr-1 h-3 w-3" />
                            ) : (
                              <User className="mr-1 h-3 w-3" />
                            )}
                            {u.role === 'admin' ? 'Admin' : 'Staff'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(u.created_at), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          {u.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
