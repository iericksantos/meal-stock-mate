import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface StockStats {
  totalItems: number;
  lowStock: number;
  expiringSoon: number;
  upToDate: number;
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StockStats>({
    totalItems: 0,
    lowStock: 0,
    expiringSoon: 0,
    upToDate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: items, error } = await supabase
          .from('items')
          .select('*');

        if (error) throw error;

        const today = new Date();
        let lowStock = 0;
        let expiringSoon = 0;

        items?.forEach((item) => {
          if (item.current_stock < item.min_stock) {
            lowStock++;
          }
          if (item.expiry_date) {
            const daysUntilExpiry = differenceInDays(parseISO(item.expiry_date), today);
            if (daysUntilExpiry <= 1 && daysUntilExpiry >= 0) {
              expiringSoon++;
            }
          }
        });

        setStats({
          totalItems: items?.length || 0,
          lowStock,
          expiringSoon,
          upToDate: (items?.length || 0) - lowStock - expiringSoon,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleCardClick = (filter?: string) => {
    if (filter) {
      navigate(`/stock-entry?filter=${filter}`);
    }
  };

  const statCards = [
    {
      titleKey: 'dashboard.total_items',
      value: stats.totalItems,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      clickable: false,
    },
    {
      titleKey: 'dashboard.low_stock',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      clickable: true,
      filter: 'low-stock',
    },
    {
      titleKey: 'dashboard.expiring_soon',
      value: stats.expiringSoon,
      icon: Clock,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      clickable: true,
      filter: 'expiring',
    },
    {
      titleKey: 'dashboard.up_to_date',
      value: stats.upToDate,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      clickable: false,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t('dashboard.title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card 
              key={stat.titleKey} 
              className={`animate-fade-in transition-all ${
                stat.clickable 
                  ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-primary/50' 
                  : ''
              }`}
              onClick={() => stat.clickable && stat.filter && handleCardClick(stat.filter)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(stat.titleKey)}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? '...' : stat.value}
                </div>
                {stat.clickable && stat.value > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.click_to_view')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quick_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t('dashboard.your_profile')}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email} • <span className="capitalize">{role}</span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium">{t('dashboard.color_legend')}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-danger-light border border-danger" />
                  <span className="text-sm">{t('dashboard.expiring_legend')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-warning-light border border-warning" />
                  <span className="text-sm">{t('dashboard.low_stock_legend')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
