import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Minus,
  Printer,
  X,
  ShoppingCart,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RestaurantTable {
  id: string;
  table_number: number;
  capacity: number;
  status: string;
  current_order_id: string | null;
}

interface Order {
  id: string;
  table_id: string;
  status: string;
  waiter_id: string;
  opened_at: string;
  total: number;
}

interface OrderItem {
  id: string;
  order_id: string;
  dish_id: string | null;
  dish_name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  status: string;
  sent_at: string;
}

interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface TechnicalSheet {
  id: string;
  dish_id: string;
  item_id: string;
  quantity_per_sale: number;
}

interface Item {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  units_per_package: number;
}

interface StockIssue {
  itemName: string;
  needed: number;
  available: number;
  unit: string;
}

export default function DiningRoom() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [technicalSheets, setTechnicalSheets] = useState<TechnicalSheet[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [closeOrderConfirmOpen, setCloseOrderConfirmOpen] = useState(false);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  const [stockAlertOpen, setStockAlertOpen] = useState(false);

  // Current order data
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
    
    // Set up realtime subscriptions
    const tablesChannel = supabase
      .channel('tables-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_tables' },
        (payload: RealtimePostgresChangesPayload<RestaurantTable>) => {
          if (payload.eventType === 'UPDATE') {
            setTables(current => 
              current.map(t => t.id === (payload.new as RestaurantTable).id ? payload.new as RestaurantTable : t)
            );
          }
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    const orderItemsChannel = supabase
      .channel('order-items-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => fetchOrderItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderItemsChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [tablesRes, ordersRes, orderItemsRes, dishesRes, sheetsRes, itemsRes] = await Promise.all([
        supabase.from('restaurant_tables').select('*').order('table_number'),
        supabase.from('orders').select('*').eq('status', 'open'),
        supabase.from('order_items').select('*'),
        supabase.from('dishes').select('*').order('name'),
        supabase.from('technical_sheets').select('*'),
        supabase.from('items').select('id, name, unit, current_stock, units_per_package'),
      ]);

      if (tablesRes.error) throw tablesRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (orderItemsRes.error) throw orderItemsRes.error;
      if (dishesRes.error) throw dishesRes.error;
      if (sheetsRes.error) throw sheetsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setTables(tablesRes.data || []);
      setOrders(ordersRes.data || []);
      setOrderItems(orderItemsRes.data || []);
      setDishes(dishesRes.data || []);
      setTechnicalSheets(sheetsRes.data || []);
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('common.error'),
        description: t('dining.load_error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').eq('status', 'open');
    if (data) setOrders(data);
  };

  const fetchOrderItems = async () => {
    const { data } = await supabase.from('order_items').select('*');
    if (data) setOrderItems(data);
  };

  const getTableOrder = (tableId: string) => {
    return orders.find(o => o.table_id === tableId && o.status === 'open');
  };

  const getOrderItems = (orderId: string) => {
    return orderItems.filter(oi => oi.order_id === orderId);
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    
    if (table.status === 'free') {
      // Create new order
      try {
        const { data: newOrder, error } = await supabase
          .from('orders')
          .insert({
            table_id: table.id,
            waiter_id: user?.id,
            status: 'open',
          })
          .select()
          .single();

        if (error) throw error;

        // Update table status
        await supabase
          .from('restaurant_tables')
          .update({ status: 'occupied', current_order_id: newOrder.id })
          .eq('id', table.id);

        setCurrentOrder(newOrder);
        setCurrentOrderItems([]);
        setDishQuantities({});
        setOrderModalOpen(true);
        fetchData();
      } catch (error) {
        console.error('Error creating order:', error);
        toast({
          title: t('common.error'),
          description: t('dining.order_create_error'),
          variant: 'destructive',
        });
      }
    } else {
      // Open existing order
      const existingOrder = getTableOrder(table.id);
      if (existingOrder) {
        setCurrentOrder(existingOrder);
        setCurrentOrderItems(getOrderItems(existingOrder.id));
        setDishQuantities({});
        setOrderModalOpen(true);
      }
    }
  };

  const validateStockForDish = (dishId: string, quantity: number): StockIssue[] => {
    const issues: StockIssue[] = [];
    const dishSheets = technicalSheets.filter(ts => ts.dish_id === dishId);

    for (const sheet of dishSheets) {
      const item = items.find(i => i.id === sheet.item_id);
      if (!item) continue;

      // Calculate needed quantity considering units_per_package
      const neededUnits = sheet.quantity_per_sale * quantity;
      const neededPackages = neededUnits / item.units_per_package;

      if (item.current_stock < neededPackages) {
        issues.push({
          itemName: item.name,
          needed: neededPackages,
          available: item.current_stock,
          unit: item.unit,
        });
      }
    }

    return issues;
  };

  const addDishToOrder = async (dish: Dish) => {
    if (!currentOrder || !user) return;

    const quantity = dishQuantities[dish.id] || 1;
    
    // Validate stock
    const issues = validateStockForDish(dish.id, quantity);
    if (issues.length > 0) {
      setStockIssues(issues);
      setStockAlertOpen(true);
      return;
    }

    try {
      // Add item to order
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: currentOrder.id,
          dish_id: dish.id,
          dish_name: dish.name,
          quantity,
          unit_price: dish.price,
          status: 'pending',
          sent_at: new Date().toISOString(),
        });

      if (itemError) throw itemError;

      // Deduct stock
      const dishSheets = technicalSheets.filter(ts => ts.dish_id === dish.id);
      for (const sheet of dishSheets) {
        const item = items.find(i => i.id === sheet.item_id);
        if (!item) continue;

        const neededUnits = sheet.quantity_per_sale * quantity;
        const neededPackages = neededUnits / item.units_per_package;
        const newStock = item.current_stock - neededPackages;

        await supabase
          .from('items')
          .update({
            current_stock: newStock,
            last_count_date: new Date().toISOString().split('T')[0],
            last_counted_by: user.id,
          })
          .eq('id', item.id);

        // Record in stock history
        await supabase
          .from('stock_history')
          .insert({
            item_id: item.id,
            previous_stock: item.current_stock,
            new_stock: newStock,
            changed_by: user.id,
            movement_type: 'withdrawal',
            reason: `${t('dining.sale_reason')}: ${dish.name} x${quantity} - Mesa ${selectedTable?.table_number}`,
          });
      }

      // Update order total
      const newTotal = (currentOrder.total || 0) + (dish.price * quantity);
      await supabase
        .from('orders')
        .update({ total: newTotal })
        .eq('id', currentOrder.id);

      toast({ title: t('dining.item_added') });
      setDishQuantities({ ...dishQuantities, [dish.id]: 1 });
      setMenuModalOpen(false);
      fetchData();
      
      // Refresh current order items
      const { data: updatedItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', currentOrder.id);
      if (updatedItems) setCurrentOrderItems(updatedItems);

      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', currentOrder.id)
        .single();
      if (updatedOrder) setCurrentOrder(updatedOrder);

    } catch (error) {
      console.error('Error adding dish to order:', error);
      toast({
        title: t('common.error'),
        description: t('dining.add_item_error'),
        variant: 'destructive',
      });
    }
  };

  const removeOrderItem = async (itemId: string) => {
    try {
      const item = currentOrderItems.find(i => i.id === itemId);
      if (!item || !currentOrder) return;

      await supabase.from('order_items').delete().eq('id', itemId);

      // Update order total
      const newTotal = (currentOrder.total || 0) - (item.unit_price * item.quantity);
      await supabase
        .from('orders')
        .update({ total: Math.max(0, newTotal) })
        .eq('id', currentOrder.id);

      setCurrentOrderItems(current => current.filter(i => i.id !== itemId));
      setCurrentOrder(prev => prev ? { ...prev, total: Math.max(0, newTotal) } : null);
      
      toast({ title: t('dining.item_removed') });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const closeOrder = async () => {
    if (!currentOrder || !selectedTable) return;

    try {
      await supabase
        .from('orders')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', currentOrder.id);

      await supabase
        .from('restaurant_tables')
        .update({ status: 'free', current_order_id: null })
        .eq('id', selectedTable.id);

      toast({ title: t('dining.order_closed') });
      setCloseOrderConfirmOpen(false);
      setOrderModalOpen(false);
      setCurrentOrder(null);
      setCurrentOrderItems([]);
      fetchData();
    } catch (error) {
      console.error('Error closing order:', error);
      toast({
        title: t('common.error'),
        description: t('dining.close_error'),
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    setPrintModalOpen(true);
  };

  const printReceipt = () => {
    window.print();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t('dining.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('dining.subtitle')}</p>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((table) => {
            const order = getTableOrder(table.id);
            const isFree = table.status === 'free';
            
            return (
              <Card
                key={table.id}
                className={cn(
                  'cursor-pointer transition-all hover:scale-105 hover:shadow-lg',
                  isFree 
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                )}
                onClick={() => handleTableClick(table)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold',
                    isFree ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  )}>
                    {table.table_number}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{table.capacity}</span>
                  </div>
                  <Badge 
                    variant={isFree ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {isFree ? t('dining.status_free') : t('dining.status_occupied')}
                  </Badge>
                  {order && (
                    <p className="mt-2 text-sm font-medium">
                      {formatCurrency(order.total || 0)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Modal */}
        <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {t('dining.table')} {selectedTable?.table_number}
              </DialogTitle>
              <DialogDescription>
                {t('dining.order_description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Order Items */}
              {currentOrderItems.length > 0 ? (
                <div className="space-y-2">
                  {currentOrderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{item.dish_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeOrderItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {t('dining.no_items')}
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-lg font-bold">Total</p>
                <p className="text-lg font-bold">
                  {formatCurrency(currentOrder?.total || 0)}
                </p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="h-14 text-lg"
                  onClick={() => setMenuModalOpen(true)}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {t('dining.add_item')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 text-lg"
                  onClick={handlePrint}
                  disabled={currentOrderItems.length === 0}
                >
                  <Printer className="mr-2 h-5 w-5" />
                  {t('dining.print_bill')}
                </Button>
              </div>

              <Button
                size="lg"
                variant="destructive"
                className="h-14 w-full text-lg"
                onClick={() => setCloseOrderConfirmOpen(true)}
                disabled={currentOrderItems.length === 0}
              >
                <X className="mr-2 h-5 w-5" />
                {t('dining.close_order')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Menu Modal */}
        <Dialog open={menuModalOpen} onOpenChange={setMenuModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('dining.menu')}</DialogTitle>
              <DialogDescription>
                {t('dining.select_dish')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-4">
              {dishes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t('dining.no_dishes')}
                </div>
              ) : (
                dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{dish.name}</p>
                      {dish.description && (
                        <p className="text-sm text-muted-foreground">{dish.description}</p>
                      )}
                      <p className="mt-1 font-bold text-primary">
                        {formatCurrency(dish.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => {
                          const current = dishQuantities[dish.id] || 1;
                          if (current > 1) {
                            setDishQuantities({ ...dishQuantities, [dish.id]: current - 1 });
                          }
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {dishQuantities[dish.id] || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => {
                          const current = dishQuantities[dish.id] || 1;
                          setDishQuantities({ ...dishQuantities, [dish.id]: current + 1 });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="lg"
                        className="ml-2 h-10"
                        onClick={() => addDishToOrder(dish)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Print Receipt Modal */}
        <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('dining.receipt')}</DialogTitle>
            </DialogHeader>
            
            {/* Receipt for printing */}
            <div id="receipt" className="receipt-print bg-white p-4 text-black">
              <div className="text-center">
                <h2 className="text-lg font-bold">RESTAURANTE</h2>
                <p className="text-sm">--------------------------------</p>
                <p className="text-sm">{t('dining.table')} {selectedTable?.table_number}</p>
                <p className="text-xs">{new Date().toLocaleString('pt-BR')}</p>
                <p className="text-sm">--------------------------------</p>
              </div>
              
              <div className="my-4 space-y-1">
                {currentOrderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.dish_name}</span>
                    <span>{formatCurrency(item.quantity * item.unit_price)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed pt-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>TOTAL</span>
                  <span>{formatCurrency(currentOrder?.total || 0)}</span>
                </div>
              </div>
              
              <div className="mt-4 text-center text-xs">
                <p>Obrigado pela preferência!</p>
              </div>
            </div>

            <Button onClick={printReceipt} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              {t('dining.print')}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Close Order Confirmation */}
        <AlertDialog open={closeOrderConfirmOpen} onOpenChange={setCloseOrderConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dining.close_order_confirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dining.close_order_desc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={closeOrder}>
                {t('dining.confirm_close')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stock Alert */}
        <AlertDialog open={stockAlertOpen} onOpenChange={setStockAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t('dining.stock_insufficient')}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                {stockIssues.map((issue, idx) => (
                  <p key={idx} className="text-sm">
                    <strong>{issue.itemName}</strong>: {t('dining.needed')} {issue.needed.toFixed(2)} {issue.unit}, {t('dining.available')} {issue.available.toFixed(2)} {issue.unit}
                  </p>
                ))}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setStockAlertOpen(false)}>
                {t('common.cancel')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt, #receipt * {
            visibility: visible;
          }
          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            font-family: 'Courier New', monospace;
          }
        }
        .receipt-print {
          font-family: 'Courier New', monospace;
          width: 80mm;
          max-width: 100%;
        }
      `}</style>
    </DashboardLayout>
  );
}
