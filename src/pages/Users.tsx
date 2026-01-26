import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { ptBR, es, enUS } from 'date-fns/locale';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: 'admin' | 'staff';
  full_name: string;
}

export default function Users() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
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

  const getDateLocale = () => {
    switch (language) {
      case 'es': return es;
      case 'en': return enUS;
      default: return ptBR;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

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
        title: t('users.load_error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast({
        title: t('users.fill_all_fields'),
        variant: 'destructive',
      });
      return;
    }

    if (newUser.password.length < 6) {
      toast({
        title: t('users.password_min'),
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User not created');

      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        full_name: newUser.full_name,
      });

      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: newUser.role,
      });

      if (roleError) throw roleError;

      toast({ title: t('users.created_success') });
      setNewUser({ email: '', password: '', full_name: '', role: 'staff' });
      setModalOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const message = error instanceof Error ? error.message : '';
      if (message.includes('already registered')) {
        toast({
          title: t('users.email_exists'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('users.create_error'),
          description: message,
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
        title: t('users.delete_self_error'),
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(t('users.confirm_delete'))) return;

    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({ title: t('users.deleted') });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: t('users.delete_error'),
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
            <h1 className="text-2xl font-bold md:text-3xl">{t('users.title')}</h1>
            <p className="mt-1 text-muted-foreground">
              {t('users.subtitle')}
            </p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('users.new_user')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('users.add_user')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('users.full_name')}</Label>
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
                  <Label htmlFor="email">{t('auth.email')}</Label>
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
                  <Label htmlFor="password">{t('auth.password')}</Label>
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
                  <Label>{t('users.user_type')}</Label>
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
                          {t('users.staff_desc')}
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {t('users.admin_desc')}
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
                  {creating ? t('users.creating') : t('users.create_user')}
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
              <h3 className="mt-4 text-lg font-medium">{t('users.no_users')}</h3>
              <p className="mt-2 text-center text-muted-foreground">
                {t('users.add_users_desc')}
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
                      <TableHead className="font-semibold">{t('table.name')}</TableHead>
                      <TableHead className="font-semibold">{t('table.type')}</TableHead>
                      <TableHead className="font-semibold">{t('users.registered_at')}</TableHead>
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
                                <span className="text-xs text-muted-foreground">{t('users.you')}</span>
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
                            {t(`common.${u.role}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(u.created_at), "dd 'de' MMMM 'de' yyyy", {
                            locale: getDateLocale(),
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
