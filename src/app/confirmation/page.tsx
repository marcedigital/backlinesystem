"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Upload, BadgePercent } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { format } from 'date-fns';

export default function Confirmation() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState<string>('');
  const router = useRouter();
  
  const { 
    bookingData, 
    setPaymentProofImage, 
    couponCode, 
    setCouponCode, 
    discountPercentage, 
    setDiscountPercentage 
  } = useBooking();
  
  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      router.push('/');
    }
  }, [bookingData, router]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      // Store the image URL (in a real app, this would be uploaded to a server)
      setPaymentProofImage(preview);
      
      toast.success("Comprobante cargado exitosamente. Su reserva ha sido confirmada.");
      
      // Navigate to thank you page - fixed path
      setTimeout(() => router.push("/thankyou"), 1500);
    } else {
      toast.error("Por favor cargue un comprobante de pago");
    }
  };
  
  const handleCouponApply = () => {
    const couponCode = couponInput.trim().toUpperCase();
    
    if (couponCode === "20OFF") {
      setCouponCode(couponCode);
      setDiscountPercentage(20);
      toast.success("Cupón aplicado: 20% de descuento");
    } else {
      setCouponCode(null);
      setDiscountPercentage(0);
      toast.error("Cupón inválido o expirado");
    }
  };
  
  // Format currency as Costa Rican Colones
  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };
  
  if (!bookingData) {
    return null; // Don't render anything if no booking data (will redirect via useEffect)
  }
  
  // Calculate hours difference
  const calculateHours = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;
    const diffMs = bookingData.endTime.getTime() - bookingData.startTime.getTime();
    return Math.round(diffMs / (1000 * 60 * 60));
  };
  
  const totalHours = calculateHours();
  const basePrice = 10000;
  const additionalHoursPrice = totalHours > 1 ? (totalHours - 1) * 5000 : 0;
  
  // Calculate add-ons total
  const addOnsTotal = bookingData.addOns
    .filter(addon => addon.selected)
    .reduce((sum, addon) => sum + addon.price, 0);
  
  const subtotal = basePrice + additionalHoursPrice + addOnsTotal;
  const discountAmount = discountPercentage > 0 ? (subtotal * discountPercentage / 100) : 0;
  const total = subtotal - discountAmount;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
        <Card className="w-full max-w-2xl mb-8">
          <CardHeader className="bg-gradient-to-r from-booking-blue/10 to-booking-purple/10">
            <CardTitle className="text-2xl">Resumen de Reserva</CardTitle>
            <CardDescription>
              Detalles de su reserva de sala de ensayo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Información de Reserva</h3>
                <span className="text-sm text-muted-foreground">#{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-sm text-muted-foreground">Sala:</p>
                  <p className="font-medium">{bookingData.room}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha:</p>
                  <p className="font-medium">
                    {bookingData.startTime ? 
                      format(bookingData.startTime, "EEEE, d MMMM yyyy") : 
                      "No disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora de inicio:</p>
                  <p className="font-medium">
                    {bookingData.startTime ? format(bookingData.startTime, "HH:mm") : "No disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora de fin:</p>
                  <p className="font-medium">
                    {bookingData.endTime ? format(bookingData.endTime, "HH:mm") : "No disponible"}
                  </p>
                </div>
              </div>
              
              {/* Coupon Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <BadgePercent className="w-5 h-5 mr-2 text-booking-blue" />
                  <h3 className="text-lg font-semibold">Cupón de Descuento</h3>
                </div>
                
                <div className="flex gap-2">
                  <div className="grow">
                    <Input
                      type="text"
                      placeholder="Ingrese su código de cupón"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    onClick={handleCouponApply}
                    variant="outline"
                    className="shrink-0 border-booking-blue text-booking-blue hover:bg-booking-blue/10"
                  >
                    Aplicar
                  </Button>
                </div>
                
                {couponCode && (
                  <div className="mt-2 text-sm font-medium text-green-600 flex items-center">
                    <span>Cupón aplicado: {discountPercentage}% de descuento</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Detalles del Costo</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Primera hora</span>
                    <span>{formatCurrency(basePrice)}</span>
                  </div>
                  
                  {totalHours > 1 && (
                    <div className="flex justify-between">
                      <span>Horas adicionales ({totalHours - 1} x ₡5,000)</span>
                      <span>{formatCurrency(additionalHoursPrice)}</span>
                    </div>
                  )}
                  
                  {bookingData.addOns
                    .filter(addon => addon.selected)
                    .map((addon, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{addon.name}</span>
                        <span>{formatCurrency(addon.price)}</span>
                      </div>
                    ))}
                    
                  {discountPercentage > 0 && (
                    <>
                      <div className="flex justify-between pt-2">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Descuento ({discountPercentage}%)</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Comprobante de Pago</CardTitle>
            <CardDescription>
              Por favor cargue su comprobante de pago por SINPE (88888888, Andres Bustamante) para completar su reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center">
                {preview ? (
                  <div className="w-full flex flex-col items-center">
                    <img 
                      src={preview} 
                      alt="Comprobante" 
                      className="max-w-full max-h-64 object-contain mb-4" 
                    />
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="mb-2 text-sm text-center text-muted-foreground">
                      Haga clic para cargar o arrastre y suelte
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      PNG, JPG o JPEG (máx. 10MB)
                    </p>
                    <label htmlFor="file-upload" className="mt-4 cursor-pointer">
                      <span className="bg-booking-blue text-white px-4 py-2 rounded-md hover:bg-booking-blue/90 transition-colors">
                        Seleccionar archivo
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                      />
                    </label>
                  </>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-booking-blue hover:bg-booking-blue/90"
              >
                Confirmar Reserva
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Una vez confirmado el pago, recibirá un correo electrónico con los detalles de su reserva.
            </p>
          </CardFooter>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Music Rehearsal Scheduler &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}