"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  couponType: 'one-time' | 'time-limited';
  startDate?: Date;
  endDate?: Date;
  active: boolean;
};

const CouponsSettings = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([
    { 
      id: '1', 
      code: 'PROMO10', 
      discountType: 'percentage', 
      value: 10, 
      couponType: 'one-time', 
      active: true 
    },
    { 
      id: '2', 
      code: 'VERANO2023', 
      discountType: 'percentage', 
      value: 15, 
      couponType: 'time-limited', 
      startDate: new Date(2023, 5, 1), 
      endDate: new Date(2023, 7, 31), 
      active: true 
    },
    { 
      id: '3', 
      code: 'DESCUENTO5000', 
      discountType: 'fixed', 
      value: 5000, 
      couponType: 'one-time', 
      active: false 
    }
  ]);

  // Form state
  const [newCoupon, setNewCoupon] = useState<Omit<Coupon, 'id'>>({
    code: '',
    discountType: 'percentage',
    value: 0,
    couponType: 'one-time',
    active: true
  });

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleToggleActive = (id: string) => {
    setCoupons(coupons.map(coupon => 
      coupon.id === id 
        ? { ...coupon, active: !coupon.active } 
        : coupon
    ));
    
    const coupon = coupons.find(c => c.id === id);
    
    toast({
      title: `Cupón ${coupon?.active ? 'desactivado' : 'activado'}`,
      description: `El cupón "${coupon?.code}" ha sido ${coupon?.active ? 'desactivado' : 'activado'}.`,
    });
  };

  const handleAddCoupon = () => {
    if (!newCoupon.code || newCoupon.value <= 0) {
      toast({
        title: "Error al crear cupón",
        description: "Por favor complete todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    const couponToAdd: Coupon = {
      ...newCoupon,
      id: Date.now().toString(),
    };

    if (newCoupon.couponType === 'time-limited') {
      if (!startDate || !endDate) {
        toast({
          title: "Error al crear cupón",
          description: "Por favor seleccione las fechas de inicio y fin para el cupón con límite de tiempo.",
          variant: "destructive",
        });
        return;
      }
      
      couponToAdd.startDate = new Date(startDate);
      couponToAdd.endDate = new Date(endDate);
    }

    setCoupons([...coupons, couponToAdd]);
    
    // Reset form
    setNewCoupon({
      code: '',
      discountType: 'percentage',
      value: 0,
      couponType: 'one-time',
      active: true
    });
    setStartDate('');
    setEndDate('');

    toast({
      title: "Cupón creado",
      description: `El cupón "${couponToAdd.code}" ha sido creado exitosamente.`,
    });
  };

  const handleDeleteCoupon = (id: string) => {
    const couponToDelete = coupons.find(c => c.id === id);
    setCoupons(coupons.filter(coupon => coupon.id !== id));
    
    toast({
      title: "Cupón eliminado",
      description: `El cupón "${couponToDelete?.code}" ha sido eliminado exitosamente.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gestión de Cupones</h3>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear Nuevo Cupón</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Código del Cupón</Label>
              <Input 
                id="coupon-code" 
                placeholder="Ej. VERANO2023" 
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount-value">Valor del Descuento</Label>
              <div className="flex gap-2">
                <Input 
                  id="discount-value" 
                  type="number" 
                  placeholder="Ej. 10" 
                  value={newCoupon.value || ''}
                  onChange={(e) => setNewCoupon({...newCoupon, value: Number(e.target.value)})}
                />
                <Select 
                  value={newCoupon.discountType} 
                  onValueChange={(value: 'percentage' | 'fixed') => setNewCoupon({...newCoupon, discountType: value})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de descuento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto Fijo (₡)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coupon-type">Tipo de Cupón</Label>
              <Select 
                value={newCoupon.couponType} 
                onValueChange={(value: 'one-time' | 'time-limited') => setNewCoupon({...newCoupon, couponType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de cupón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">Un solo uso</SelectItem>
                  <SelectItem value="time-limited">Periodo limitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex items-center">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="coupon-active" 
                  checked={newCoupon.active}
                  onCheckedChange={(checked) => setNewCoupon({...newCoupon, active: checked})}
                />
                <Label htmlFor="coupon-active">Cupón Activo</Label>
              </div>
            </div>
            
            {newCoupon.couponType === 'time-limited' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha de Inicio</Label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha de Fin</Label>
                  <Input 
                    id="end-date" 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleAddCoupon} className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Crear Cupón
          </Button>
        </CardFooter>
      </Card>
      
      <div>
        <h4 className="text-base font-medium mb-2">Cupones Existentes</h4>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Validez</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No hay cupones disponibles
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.value}%` 
                        : `₡${coupon.value.toLocaleString('es-CR')}`}
                    </TableCell>
                    <TableCell>
                      {coupon.couponType === 'one-time' ? 'Un solo uso' : 'Periodo limitado'}
                    </TableCell>
                    <TableCell>
                      {coupon.couponType === 'time-limited' && coupon.startDate && coupon.endDate 
                        ? `${format(coupon.startDate, 'dd/MM/yyyy', { locale: es })} - ${format(coupon.endDate, 'dd/MM/yyyy', { locale: es })}`
                        : 'Sin fecha límite'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id={`coupon-${coupon.id}-active`} 
                          checked={coupon.active}
                          onCheckedChange={() => handleToggleActive(coupon.id)}
                        />
                        <Label htmlFor={`coupon-${coupon.id}-active`}>
                          {coupon.active ? 'Activo' : 'Inactivo'}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CouponsSettings;
