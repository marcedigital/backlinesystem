"use client";

import Image from 'next/image';
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import ReservasCalendarView from "./ReservasCalendarView";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Define the Reservation type for TypeScript
interface Reservation {
  _id: string;
  clientName: string;
  email: string;
  date?: string;
  phoneNumber?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  roomId: string;
  room?: string;
  status: "Revisar" | "Aprobada" | "Cancelada" | "Completa";
  paymentProof: string;
  totalPrice: number;
  addOns?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  couponCode?: string;
  discountAmount?: number;
  googleCalendarEventId?: string;
  createdAt: string;
}

const ReservasList = () => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // Fetch reservations when component mounts or when page changes
  useEffect(() => {
    fetchReservations();
  }, [page]);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/bookings?page=${page}&limit=10${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      
      const data = await response.json();
      
      // Map room IDs to room names
      const reservationsWithRoomNames = data.bookings.map((booking: any) => ({
        ...booking,
        room: booking.roomId === 'room1' ? 'Sala 1' : 'Sala 2',
        date: new Date(booking.startTime).toISOString().split('T')[0]
      }));
      
      setReservations(reservationsWithRoomNames);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError('Could not load reservations. Please try again later.');
      toast({
        title: "Error",
        description: "Could not load reservations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "Aprobada" | "Cancelada") => {
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update reservation status');
      }

      const data = await response.json();
      
      // Update reservation in state
      setReservations(prev => prev.map(reservation => 
        reservation._id === selectedReservation._id 
          ? { ...reservation, status: newStatus } 
          : reservation
      ));
      
      setSelectedReservation({ ...selectedReservation, status: newStatus });

      toast({
        title: `Reserva ${newStatus === "Aprobada" ? "aprobada" : "rechazada"}`,
        description: `Se ha ${
          newStatus === "Aprobada" ? "aprobado" : "rechazado"
        } la reserva de ${selectedReservation.clientName}.${data.calendarMessage ? ` ${data.calendarMessage}` : ''}`,
      });
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el estado de la reserva",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    fetchReservations();
  };

  const openReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Revisar":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            Revisar
          </Badge>
        );
      case "Aprobada":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Aprobada
          </Badge>
        );
      case "Cancelada":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Cancelada
          </Badge>
        );
      case "Completa":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-300"
          >
            Completa
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Calculate duration in hours
  const calculateDuration = (startTime: Date | string, endTime: Date | string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMs = end.getTime() - start.getTime();
    return Math.round(diffInMs / (1000 * 60 * 60));
  };

  // Format currency as Costa Rican Colones
  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString("es-CR")}`;
  };

  // Check if a reservation date is in the future
  const isDateInFuture = (dateString: Date | string) => {
    const reservationDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservationDate >= today;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar reservas..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSearch}
            className="sm:ml-2"
          >
            Buscar
          </Button>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) =>
              value && setView(value as "list" | "calendar")
            }
            className="h-9 ml-0 sm:ml-4"
          >
            <ToggleGroupItem value="list" aria-label="Lista">
              Lista
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendario">
              Calendario
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReservations}
          className="self-end sm:self-auto"
        >
          Actualizar
        </Button>
      </div>

      {view === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Listado de Reservas</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">{error}</div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No se encontraron reservas
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                      <TableHead className="hidden sm:table-cell">Hora</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Duración
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">Sala</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow
                        key={reservation._id}
                        className="cursor-pointer hover:bg-muted/80"
                      >
                        <TableCell
                          className="font-medium"
                          onClick={() => openReservationDetails(reservation)}
                        >
                          {reservation.clientName}
                          <div className="block sm:hidden text-xs text-gray-500 mt-1">
                            {formatDate(reservation.startTime)} · {formatTime(reservation.startTime)} ·{" "}
                            {reservation.room}
                          </div>
                        </TableCell>
                        <TableCell
                          className="hidden sm:table-cell"
                          onClick={() => openReservationDetails(reservation)}
                        >
                          {formatDate(reservation.startTime)}
                        </TableCell>
                        <TableCell
                          className="hidden sm:table-cell"
                          onClick={() => openReservationDetails(reservation)}
                        >
                          {formatTime(reservation.startTime)}
                        </TableCell>
                        <TableCell
                          className="hidden sm:table-cell"
                          onClick={() => openReservationDetails(reservation)}
                        >
                          {reservation.duration}{" "}
                          {reservation.duration === 1 ? "hora" : "horas"}
                        </TableCell>
                        <TableCell
                          className="hidden sm:table-cell"
                          onClick={() => openReservationDetails(reservation)}
                        >
                          {reservation.room}
                        </TableCell>
                        <TableCell
                          onClick={() => openReservationDetails(reservation)}
                        >
                          {getStatusBadge(reservation.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReservationDetails(reservation)}
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(page - 1)}
                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                          .map((pageNum, i, arr) => {
                            // Add ellipsis if there's a gap in page numbers
                            if (i > 0 && pageNum > arr[i - 1] + 1) {
                              return (
                                <React.Fragment key={`ellipsis-${pageNum}`}>
                                  <PaginationItem>
                                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                                  </PaginationItem>
                                  <PaginationItem>
                                    <PaginationLink
                                      isActive={page === pageNum}
                                      onClick={() => handlePageChange(pageNum)}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                </React.Fragment>
                              );
                            }
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  isActive={page === pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(page + 1)}
                            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <ReservasCalendarView
          reservations={reservations.map(r => ({
            id: r._id,
            clientName: r.clientName,
            email: r.email,
            date: new Date(r.startTime).toISOString().split('T')[0],
            time: formatTime(r.startTime),
            duration: r.duration,
            room: r.room || '',
            status: r.status,
            paymentProof: r.paymentProof
          }))}
          onReservationClick={(calendarReservation) => {
            // Find the original reservation that matches the calendar reservation ID
            const original = reservations.find(r => r._id === calendarReservation.id);
            if (original) {
              openReservationDetails(original);
            }
          }}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedReservation && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles de Reserva</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {selectedReservation.phoneNumber && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Teléfono
                  </p>
                  <p>{selectedReservation.phoneNumber}</p>
                </div>
              )}

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
                  {getStatusBadge(selectedReservation.status)}
                </div>
              </div>

              {selectedReservation.addOns && selectedReservation.addOns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Extras
                  </p>
                  <ul className="mt-1 ml-4 list-disc">
                    {selectedReservation.addOns.map((addon, index) => (
                      <li key={index}>{addon.name} - {formatCurrency(addon.price)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReservation.couponCode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Cupón aplicado
                  </p>
                  <p>{selectedReservation.couponCode} ({selectedReservation.discountAmount ? formatCurrency(selectedReservation.discountAmount) : 'N/A'})</p>
                </div>
              )}

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
                      className="w-full h-40 object-cover rounded-md"
                      unoptimized={selectedReservation.paymentProof.startsWith(
                        "https://"
                      )}
                    />
                  </a>
                </div>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between">
              {selectedReservation.status === "Revisar" ? (
                <div className="flex space-x-2 w-full">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange("Cancelada")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Procesando..." : "Rechazar"}
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleStatusChange("Aprobada")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Procesando..." : "Aprobar"}
                  </Button>
                </div>
              ) : selectedReservation.status === "Cancelada" &&
                isDateInFuture(selectedReservation.startTime) ? (
                <div className="flex space-x-2 w-full">
                  <Button
                    className="w-full"
                    onClick={() => handleStatusChange("Aprobada")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Procesando..." : "Aprobar Reserva Cancelada"}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="ml-auto"
                >
                  Cerrar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default ReservasList;