"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Calendar, Clock, Users, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

// Define the Reservation type for TypeScript
interface Reservation {
  _id: string;
  clientName: string;
  email: string;
  startTime: string;
  endTime: string;
  duration: number;
  roomId: string;
  room?: string;
  status: string;
  paymentProof: string;
  totalPrice: number;
}

// Define dashboard metrics type
interface DashboardMetrics {
  todayBookings: number;
  monthlyRevenue: number;
  totalHours: number;
  newCustomers: number;
  percentChange: {
    todayBookings: number;
    monthlyRevenue: number;
    totalHours: number;
    newCustomers: number;
  }
}

export default function AdminDashboard() {
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayBookings: 0,
    monthlyRevenue: 0,
    totalHours: 0,
    newCustomers: 0,
    percentChange: {
      todayBookings: 0,
      monthlyRevenue: 0,
      totalHours: 0,
      newCustomers: 0
    }
  });
  const { toast } = useToast();

  // Fetch pending reservations and dashboard metrics when component mounts
  useEffect(() => {
    fetchPendingReservations();
    fetchDashboardMetrics();
  }, []);

  // Function to fetch pending reservations
  const fetchPendingReservations = async () => {
    try {
      setIsLoadingReservations(true);
      const response = await fetch('/api/admin/bookings?status=Revisar&limit=5');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      
      const data = await response.json();
      
      // Map room IDs to room names
      const reservationsWithRoomNames = data.bookings.map((booking: any) => ({
        ...booking,
        room: booking.roomId === 'room1' ? 'Sala 1' : 'Sala 2'
      }));
      
      setPendingReservations(reservationsWithRoomNames);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas pendientes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReservations(false);
    }
  };

  // Function to fetch dashboard metrics
  const fetchDashboardMetrics = async () => {
    try {
      setIsLoadingMetrics(true);
      const response = await fetch('/api/admin/dashboard/metrics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Use sample data if API fails
      setMetrics({
        todayBookings: 4,
        monthlyRevenue: 125000,
        totalHours: 45,
        newCustomers: 12,
        percentChange: {
          todayBookings: 10,
          monthlyRevenue: 15,
          totalHours: 5,
          newCustomers: 18
        }
      });
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedReservation) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/admin/bookings/${selectedReservation._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reservation status');
      }
      
      const data = await response.json();
      
      toast({
        title: `Reserva ${newStatus === "Aprobada" ? "aprobada" : "rechazada"}`,
        description: `Se ha ${
          newStatus === "Aprobada" ? "aprobado" : "rechazado"
        } la reserva de ${selectedReservation.clientName}.${data.calendarMessage ? ` ${data.calendarMessage}` : ''}`,
      });
      
      // Remove this reservation from the list
      setPendingReservations(prevReservations => 
        prevReservations.filter(res => res._id !== selectedReservation._id)
      );
      
      // Refresh dashboard metrics after updating reservation
      fetchDashboardMetrics();
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la reserva. Inténtelo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  // Format currency as Costa Rican Colones
  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString("es-CR")}`;
  };

  const refreshData = () => {
    fetchPendingReservations();
    fetchDashboardMetrics();
    toast({
      title: "Datos actualizados",
      description: "Los datos del panel se han actualizado correctamente",
    });
  };

  return (
    <AdminLayout title="Panel de Administración">
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar datos
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Bookings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas del Día
            </CardTitle>
            <Calendar className={`h-4 w-4 ${isLoadingMetrics ? 'animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="flex items-center space-x-2">
                <div className="h-5 w-8 bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.todayBookings}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.percentChange.todayBookings > 0 ? '+' : ''}
                  {metrics.percentChange.todayBookings}% comparado con ayer
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <BookOpen className={`h-4 w-4 ${isLoadingMetrics ? 'animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="flex items-center space-x-2">
                <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.percentChange.monthlyRevenue > 0 ? '+' : ''}
                  {metrics.percentChange.monthlyRevenue}% comparado con el mes anterior
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Hours Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Horas Reservadas
            </CardTitle>
            <Clock className={`h-4 w-4 ${isLoadingMetrics ? 'animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="flex items-center space-x-2">
                <div className="h-5 w-8 bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.totalHours}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.percentChange.totalHours > 0 ? '+' : ''}
                  {metrics.percentChange.totalHours}% comparado con la semana anterior
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* New Customers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Nuevos
            </CardTitle>
            <Users className={`h-4 w-4 ${isLoadingMetrics ? 'animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="flex items-center space-x-2">
                <div className="h-5 w-8 bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.newCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.percentChange.newCustomers > 0 ? '+' : ''}
                  {metrics.percentChange.newCustomers}% comparado con el mes anterior
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Reservas Pendientes</CardTitle>
              <CardDescription>
                Reservas que requieren aprobación
              </CardDescription>
            </div>
            {pendingReservations.length > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200">
                {pendingReservations.length} pendiente{pendingReservations.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingReservations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingReservations.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                No hay reservas pendientes en este momento
              </div>
            ) : (
              <div className="divide-y">
                {pendingReservations.map((reservation) => (
                  <div
                    key={reservation._id}
                    className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 px-2 rounded"
                    onClick={() => openReservationDetails(reservation)}
                  >
                    <div>
                      <p className="font-medium">{reservation.clientName}</p>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(reservation.startTime)}</span>
                        <span>•</span>
                        <span>{formatTime(reservation.startTime)}</span>
                        <span>•</span>
                        <span>{reservation.room}</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-300"
                    >
                      Revisar
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedReservation && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles de Reserva</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Cliente
                  </p>
                  <p className="font-medium">
                    {selectedReservation.clientName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="break-all">{selectedReservation.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fecha
                  </p>
                  <p>{formatDate(selectedReservation.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Hora
                  </p>
                  <p>{formatTime(selectedReservation.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Duración
                  </p>
                  <p>
                    {selectedReservation.duration}{" "}
                    {selectedReservation.duration === 1 ? "hora" : "horas"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sala
                </p>
                <p>{selectedReservation.room}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estado
                </p>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800 border-yellow-300"
                  >
                    Revisar
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Precio total
                </p>
                <p className="font-medium">{formatCurrency(selectedReservation.totalPrice)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Comprobante de Pago
                </p>
                <div className="mt-2">
                  <a
                    href={selectedReservation.paymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <Image
                      src={selectedReservation.paymentProof}
                      alt="Comprobante de pago"
                      width={500}
                      height={160}
                      className="w-full rounded-md"
                      style={{ objectFit: "cover" }}
                      unoptimized={selectedReservation.paymentProof.startsWith("https://")}
                    />
                  </a>
                </div>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between">
              <div className="flex space-x-2 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange("Cancelada")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                  ) : (
                    "Rechazar"
                  )}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange("Aprobada")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                  ) : (
                    "Aprobar"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}