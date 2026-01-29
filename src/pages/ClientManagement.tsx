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
import { Building2, UserPlus, Trash2, Pencil, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';

type RestaurantStatus = 'active' | 'pending_payment' | 'suspended';

interface Restaurant {
  id: string;
  name: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  status: RestaurantStatus;
  created_at: string;
}

export default function ClientManagement() {
  const { isSuperAdmin } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    owner_email: '',
    owner_password: '',
    owner_name: '',
  });

  const getDateLocale = () => {
    switch (language) {
      case 'es': return es;
      case 'en': return enUS;
      default: return ptBR;
    }
  };

  const getStatusBadge = (status: RestaurantStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary/10 text-primary border-primary/20">{t('clients.status_active')}</Badge>;
      case 'pending_payment':
        return <Badge className="bg-secondary text-secondary-foreground border-secondary/50">{t('clients.status_pending')}</Badge>;
      case 'suspended':
        return <Badge variant="destructive">{t('clients.status_suspended')}</Badge>;
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRestaurants();
    }
  }, [isSuperAdmin]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch owner profiles
      const ownerIds = data?.map(r => r.owner_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', ownerIds);

      const restaurantsWithOwners: Restaurant[] = (data || []).map(restaurant => {
        const ownerProfile = profiles?.find(p => p.user_id === restaurant.owner_id);
        return {
          ...restaurant,
          status: restaurant.status as RestaurantStatus,
          owner_name: ownerProfile?.full_name || 'Sem nome',
          owner_email: ownerProfile?.email || 'Sem email',
        };
      });

      setRestaurants(restaurantsWithOwners);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: t('clients.load_error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.owner_email || !newRestaurant.owner_password || !newRestaurant.owner_name) {
      toast({
        title: t('clients.fill_all_fields'),
        variant: 'destructive',
      });
      return;
    }

    if (newRestaurant.owner_password.length < 6) {
      toast({
        title: t('users.password_min'),
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-restaurant', {
        body: {
          restaurant_name: newRestaurant.name,
          owner_email: newRestaurant.owner_email,
          owner_password: newRestaurant.owner_password,
          owner_name: newRestaurant.owner_name,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create restaurant');
      }

      if (data?.error) {
        if (data.error === 'email_exists') {
          toast({
            title: t('users.email_exists'),
            variant: 'destructive',
          });
          return;
        }
        throw new Error(data.message || data.error);
      }

      toast({ title: t('clients.created_success') });
      setNewRestaurant({ name: '', owner_email: '', owner_password: '', owner_name: '' });
      setModalOpen(false);
      fetchRestaurants();
    } catch (error: unknown) {
      console.error('Error creating restaurant:', error);
      const message = error instanceof Error ? error.message : '';
      toast({
        title: t('clients.create_error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (restaurantId: string, newStatus: RestaurantStatus) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: newStatus })
        .eq('id', restaurantId);

      if (error) throw error;

      toast({ title: t('clients.status_updated') });
      fetchRestaurants();
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: t('clients.update_error'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!confirm(t('clients.confirm_delete'))) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;

      toast({ title: t('clients.deleted') });
      fetchRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast({
        title: t('clients.delete_error'),
        variant: 'destructive',
      });
    }
  };

  // Block access for non-super_admin
  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">{t('common.access_denied')}</h1>
          <p className="text-muted-foreground">{t('common.admin_only')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{t('clients.title')}</h1>
            <p className="mt-1 text-muted-foreground">
              {t('clients.subtitle')}
            </p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('clients.new_client')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('clients.add_client')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">{t('clients.restaurant_name')}</Label>
                  <Input
                    id="restaurantName"
                    placeholder="Bar do João"
                    value={newRestaurant.name}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">{t('clients.owner_name')}</Label>
                  <Input
                    id="ownerName"
                    placeholder="João da Silva"
                    value={newRestaurant.owner_name}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, owner_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">{t('clients.owner_email')}</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="joao@email.com"
                    value={newRestaurant.owner_email}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, owner_email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">{t('clients.owner_password')}</Label>
                  <Input
                    id="ownerPassword"
                    type="password"
                    placeholder={t('users.password_min')}
                    value={newRestaurant.owner_password}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, owner_password: e.target.value })
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateRestaurant}
                  disabled={creating}
                >
                  {creating ? t('common.saving') : t('clients.create_client')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Restaurants Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : restaurants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">{t('clients.no_clients')}</h3>
              <p className="mt-2 text-center text-muted-foreground">
                {t('clients.add_clients_desc')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {restaurants.length} {restaurants.length === 1 ? t('clients.client_singular') : t('clients.client_plural')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="font-semibold">{t('clients.restaurant_name')}</TableHead>
                      <TableHead className="font-semibold">{t('clients.owner')}</TableHead>
                      <TableHead className="font-semibold">{t('table.status')}</TableHead>
                      <TableHead className="font-semibold">{t('clients.created_at')}</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurants.map((restaurant, index) => (
                      <TableRow
                        key={restaurant.id}
                        className={index % 2 === 1 ? 'bg-table-row-alt' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium uppercase text-primary">
                              {restaurant.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{restaurant.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{restaurant.owner_name}</p>
                            <p className="text-sm text-muted-foreground">{restaurant.owner_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(restaurant.status as RestaurantStatus)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(restaurant.created_at), "dd 'de' MMMM 'de' yyyy", {
                            locale: getDateLocale(),
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setEditModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRestaurant(restaurant.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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

      {/* Edit Status Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clients.edit_status')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('clients.restaurant_name')}</Label>
              <p className="text-lg font-medium">{selectedRestaurant?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('table.status')}</Label>
              <Select
                value={selectedRestaurant?.status}
                onValueChange={(value: RestaurantStatus) => {
                  if (selectedRestaurant) {
                    handleUpdateStatus(selectedRestaurant.id, value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      {t('clients.status_active')}
                    </div>
                  </SelectItem>
                  <SelectItem value="pending_payment">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-secondary"></span>
                      {t('clients.status_pending')}
                    </div>
                  </SelectItem>
                  <SelectItem value="suspended">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-destructive"></span>
                      {t('clients.status_suspended')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
