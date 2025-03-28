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

// Dummy data for reservations - updated for this year
const dummyReservations = [
  {
    id: "1",
    clientName: "Carlos Rodríguez",
    email: "carlos@example.com",
    date: "2024-03-15",
    time: "14:00",
    duration: 2,
    room: "Sala 1",
    status: "Revisar" as const,
    paymentProof: "https://placehold.co/600x400",
  },
  {
    id: "2",
    clientName: "María González",
    email: "maria@example.com",
    date: "2024-04-16",
    time: "10:00",
    duration: 1,
    room: "Sala 2",
    status: "Aprobada" as const,
    paymentProof: "https://placehold.co/600x400",
  },
  {
    id: "3",
    clientName: "Juan Pérez",
    email: "juan@example.com",
    date: "2024-04-17",
    time: "16:30",
    duration: 3,
    room: "Sala 1",
    status: "Cancelada" as const,
    paymentProof: "https://placehold.co/600x400",
  },
  {
    id: "4",
    clientName: "Ana Jiménez",
    email: "ana@example.com",
    date: "2024-05-18",
    time: "09:00",
    duration: 2,
    room: "Sala 2",
    status: "Revisar" as const,
    paymentProof: "https://placehold.co/600x400",
  },
  {
    id: "5",
    clientName: "Pedro Morales",
    email: "pedro@example.com",
    date: "2024-06-10",
    time: "15:00",
    duration: 2,
    room: "Sala 1",
    status: "Aprobada" as const,
    paymentProof: "https://placehold.co/600x400",
  },
  {
    id: "6",
    clientName: "Laura Sánchez",
    email: "laura@example.com",
    date: "2024-06-11",
    time: "11:30",
    duration: 1,
    room: "Sala 2",
    status: "Completa" as const,
    paymentProof: "https://placehold.co/600x400",
  },
  {
    id: "7",
    clientName: "Roberto Gómez",
    email: "roberto@example.com",
    date: "2024-07-22",
    time: "13:00",
    duration: 3,
    room: "Sala 1",
    status: "Revisar" as const,
    paymentProof: "https://placehold.co/600x400",
  },
  {
    id: "8",
    clientName: "Carmen Díaz",
    email: "carmen@example.com",
    date: "2024-08-05",
    time: "17:00",
    duration: 2,
    room: "Sala 2",
    status: "Aprobada" as const,
    paymentProof: "https://placehold.co/600x400",
  },
];

interface Reservation {
  id: string;
  clientName: string;
  email: string;
  date: string;
  time: string;
  duration: number;
  room: string;
  status: "Revisar" | "Aprobada" | "Cancelada" | "Completa";
  paymentProof: string;
}

const ReservasList = () => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize data and update status based on dates
    const currentDate = new Date();
    const updatedReservations = dummyReservations.map((reservation) => {
      const reservationDate = new Date(reservation.date);

      // If reservation was approved and the date has passed, mark as completed
      if (reservation.status === "Aprobada" && reservationDate < currentDate) {
        return { ...reservation, status: "Completa" as const };
      }

      return reservation;
    });

    setReservations(updatedReservations);
  }, []);

  const handleStatusChange = (newStatus: "Aprobada" | "Cancelada") => {
    if (!selectedReservation) return;

    const updatedReservations = reservations.map((reservation) =>
      reservation.id === selectedReservation.id
        ? { ...reservation, status: newStatus }
        : reservation
    );

    setReservations(updatedReservations);
    setSelectedReservation({ ...selectedReservation, status: newStatus });

    toast({
      title: `Reserva ${newStatus === "Aprobada" ? "aprobada" : "rechazada"}`,
      description: `Se ha ${
        newStatus === "Aprobada" ? "aprobado" : "rechazado"
      } la reserva de ${selectedReservation.clientName}.`,
    });
  };

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.clientName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.room.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const openReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Check if a reservation date is in the future
  const isDateInFuture = (dateString: string) => {
    const reservationDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservationDate >= today;
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
            />
          </div>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) =>
              value && setView(value as "list" | "calendar")
            }
            className="h-9"
          >
            <ToggleGroupItem value="list" aria-label="Lista">
              Lista
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendario">
              Calendario
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {view === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Listado de Reservas</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 overflow-x-auto">
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
                {filteredReservations.map((reservation) => (
                  <TableRow
                    key={reservation.id}
                    className="cursor-pointer hover:bg-muted/80"
                  >
                    <TableCell
                      className="font-medium"
                      onClick={() => openReservationDetails(reservation)}
                    >
                      {reservation.clientName}
                      <div className="block sm:hidden text-xs text-gray-500 mt-1">
                        {formatDate(reservation.date)} · {reservation.time} ·{" "}
                        {reservation.room}
                      </div>
                    </TableCell>
                    <TableCell
                      className="hidden sm:table-cell"
                      onClick={() => openReservationDetails(reservation)}
                    >
                      {formatDate(reservation.date)}
                    </TableCell>
                    <TableCell
                      className="hidden sm:table-cell"
                      onClick={() => openReservationDetails(reservation)}
                    >
                      {reservation.time}
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
          </CardContent>
        </Card>
      ) : (
        <ReservasCalendarView
          reservations={filteredReservations}
          onReservationClick={openReservationDetails}
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fecha
                  </p>
                  <p>{formatDate(selectedReservation.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Hora
                  </p>
                  <p>{selectedReservation.time}</p>
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
                  >
                    Rechazar
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleStatusChange("Aprobada")}
                  >
                    Aprobar
                  </Button>
                </div>
              ) : selectedReservation.status === "Cancelada" &&
                isDateInFuture(selectedReservation.date) ? (
                <div className="flex space-x-2 w-full">
                  <Button
                    className="w-full"
                    onClick={() => handleStatusChange("Aprobada")}
                  >
                    Aprobar Reserva Cancelada
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
