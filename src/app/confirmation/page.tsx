"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, BadgePercent, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import { format } from "date-fns";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { rooms } from "@/utils/bookingUtils";

// Content component that uses router
function ConfirmationContent() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState<string>("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  
  const {
    bookingData,
    setPaymentProofImage,
    couponCode,
    setCouponCode,
    discountPercentage,
    setDiscountPercentage,
  } = useBooking();

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      router.push("/");
    }
  }, [bookingData, router]);

  // Helper function to get room ID from room name
  function getRoomId(roomName: string): string {
    if (!roomName) return 'room1'; // Default if no room name provided
    const room = rooms.find(r => r.name === roomName);
    return room ? room.id : 'room1'; // Default to room1 if not found
  }
  
  // IMPORTANT: Calculate hours function must be defined before it's used in calculateSubtotal
  // Calculate hours difference
  const calculateHours = () => {
    if (!bookingData?.startTime || !bookingData?.endTime) return 0;
    const diffMs =
      bookingData.endTime.getTime() - bookingData.startTime.getTime();
    return Math.round(diffMs / (1000 * 60 * 60));
  };

  // Calculate subtotal before any discounts
  const calculateSubtotal = (): number => {
    const totalHours = calculateHours();
    const basePrice = 10000;
    const additionalHoursPrice = totalHours > 1 ? (totalHours - 1) * 5000 : 0;

    // Calculate add-ons total
    const addOnsTotal = bookingData?.addOns
      ?.filter((addon) => addon.selected)
      .reduce((sum, addon) => sum + addon.price * totalHours, 0) || 0;

    return basePrice + additionalHoursPrice + addOnsTotal;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  // Calculate the final price after discount
  const calculateFinalPrice = () => {
    if (!bookingData) return 0;
    const subtotal = calculateSubtotal();
    const discount = discountPercentage > 0 ? (subtotal * discountPercentage) / 100 : 0;
    return subtotal - discount;
  };
  
  // Calculate discount amount for API submission
  const discountAmount = discountPercentage > 0 ? (calculateSubtotal() * discountPercentage) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      try {
        setIsSubmitting(true);
        
        // Store the image URL locally
        setPaymentProofImage(preview);
        
        // Make sure we have the room ID correctly formatted
        const roomId = getRoomId(bookingData?.room || '');
        
        // Ensure all required fields are present
        if (!bookingData?.startTime || !bookingData?.endTime) {
          throw new Error("Missing booking time information");
        }
        
        // Prepare booking data with all required fields
        const bookingSubmitData = {
          clientName: user?.name || 'Guest User', // Ensure we have a client name
          email: user?.email || 'guest@example.com', // Ensure we have an email
          roomId: roomId,
          startTime: bookingData.startTime.toISOString(), // Ensure proper formatting
          endTime: bookingData.endTime.toISOString(), // Ensure proper formatting
          addOns: bookingData.addOns.filter(addon => addon.selected) || [],
          totalPrice: calculateFinalPrice(),
          paymentProof: preview, // URL to uploaded file
          couponCode: couponCode,
          discountAmount: discountAmount
        };
        
        console.log("Submitting booking data:", bookingSubmitData);
        
        // Submit booking to API
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingSubmitData),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create booking');
        }
        
        const data = await response.json();
        
        toast.success("Comprobante cargado exitosamente. Su reserva ha sido confirmada.");
        
        // Navigate to thank you page
        setTimeout(() => router.push("/thankyou"), 1500);
      } catch (error) {
        console.error('Error creating booking:', error);
        toast.error(error instanceof Error ? error.message : "Error al crear la reserva. Inténtelo de nuevo.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.error("Por favor cargue un comprobante de pago");
    }
  };

  const handleCouponApply = async () => {
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      toast.error("Por favor ingrese un código de cupón");
      return;
    }

    try {
      setIsValidatingCoupon(true);
      
      const response = await fetch(`/api/coupons/validate?code=${code}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Cupón inválido o expirado");
        setCouponCode(null);
        setDiscountPercentage(0);
        return;
      }

      const couponData = await response.json();
      
      // Validate coupon applicability
      if (!couponData.active) {
        toast.error("Este cupón no está activo");
        return;
      }

      // Check for time-limited coupons
      if (couponData.couponType === 'time-limited') {
        const now = new Date();
        const startDate = new Date(couponData.startDate);
        const endDate = new Date(couponData.endDate);

        if (now < startDate || now > endDate) {
          toast.error("Este cupón no está vigente");
          return;
        }
      }

      // Apply coupon
      setCouponCode(code);
      
      if (couponData.discountType === 'percentage') {
        setDiscountPercentage(couponData.value);
        toast.success(`Cupón aplicado: ${couponData.value}% de descuento`);
      } else if (couponData.discountType === 'fixed') {
        // For fixed amount, calculate percentage based on subtotal
        const subtotal = calculateSubtotal();
        const discountPercentage = Math.min((couponData.value / subtotal) * 100, 100);
        setDiscountPercentage(discountPercentage);
        toast.success(`Cupón aplicado: ₡${couponData.value.toLocaleString('es-CR')} de descuento`);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error("Ocurrió un error al validar el cupón");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Format currency as Costa Rican Colones
  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString("es-CR")}`;
  };

  if (!bookingData) {
    return null; // Don't render anything if no booking data (will redirect via useEffect)
  }

  const totalHours = calculateHours();
  const basePrice = 10000;
  const additionalHoursPrice = totalHours > 1 ? (totalHours - 1) * 5000 : 0;

  // Calculate add-ons total
  const addOnsTotal = bookingData.addOns
    .filter((addon) => addon.selected)
    .reduce((sum, addon) => sum + addon.price * totalHours, 0);

  const subtotal = calculateSubtotal();
  // This is used for display purposes in the UI
  const displayDiscountAmount = 
    discountPercentage > 0 ? (subtotal * discountPercentage) / 100 : 0;
  const total = subtotal - displayDiscountAmount;

  useEffect(() => {
    // Give some time for bookingData to be loaded from localStorage
    const timer = setTimeout(() => {
      if (!bookingData) {
        toast.error("No se encontró información de reserva");
        router.push("/");
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [bookingData, router]);

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
                <h3 className="text-lg font-semibold">
                  Información de Reserva
                </h3>
                <span className="text-sm text-muted-foreground">
                  #
                  {Math.floor(Math.random() * 10000)
                    .toString()
                    .padStart(4, "0")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-sm text-muted-foreground">Sala:</p>
                  <p className="font-medium">{bookingData.room}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha:</p>
                  <p className="font-medium">
                    {bookingData.startTime
                      ? format(bookingData.startTime, "EEEE, d MMMM yyyy")
                      : "No disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Hora de inicio:
                  </p>
                  <p className="font-medium">
                    {bookingData.startTime
                      ? format(bookingData.startTime, "HH:mm")
                      : "No disponible"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora de fin:</p>
                  <p className="font-medium">
                    {bookingData.endTime
                      ? format(bookingData.endTime, "HH:mm")
                      : "No disponible"}
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
                      disabled={isValidatingCoupon || !!couponCode}
                    />
                  </div>
                  <Button
                    onClick={handleCouponApply}
                    variant="outline"
                    className="shrink-0 border-booking-blue text-booking-blue hover:bg-booking-blue/10"
                    disabled={isValidatingCoupon || !!couponCode}
                  >
                    {isValidatingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>

                {couponCode && (
                  <div className="mt-2 text-sm font-medium text-green-600 flex items-center justify-between">
                    <span>
                      Cupón <strong>{couponCode}</strong> aplicado: {discountPercentage.toFixed(2)}% de descuento
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 h-7 px-2 py-0"
                      onClick={() => {
                        setCouponCode(null);
                        setDiscountPercentage(0);
                        setCouponInput("");
                        toast.info("Cupón removido");
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Detalles del Costo
                </h3>

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
                    .filter((addon) => addon.selected)
                    .map((addon, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{addon.name} (₡{addon.price.toLocaleString('es-CR')}/hora x {totalHours}h)</span>
                        <span>{formatCurrency(addon.price * totalHours)}</span>
                      </div>
                    ))}

                  {discountPercentage > 0 && (
                    <>
                      <div className="flex justify-between pt-2">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Descuento ({discountPercentage.toFixed(2)}%)</span>
                        <span>-{formatCurrency(displayDiscountAmount)}</span>
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
              Por favor cargue su comprobante de pago por SINPE (88888888,
              Andres Bustamante) para completar su reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center">
                {preview ? (
                  <div className="w-full flex flex-col items-center">
                    <Image
                      src={preview}
                      alt="Comprobante"
                      width={500}
                      height={256}
                      className="mb-4"
                      style={{
                        objectFit: "contain",
                        maxWidth: "100%",
                        height: "auto",
                      }}
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
                    <label
                      htmlFor="file-upload"
                      className="mt-4 cursor-pointer"
                    >
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Reserva"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Una vez confirmado el pago, recibirá un correo electrónico con los
              detalles de su reserva.
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

// Main component with Suspense
export default function Confirmation() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-booking-blue"></div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}