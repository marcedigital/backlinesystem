"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Calendar, Clock, Users } from "lucide-react";
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
  id: string;
  clientName: string;
  email: string;
  date: string;
  time: string;
  duration: number;
  room: string;
  status: string;
  paymentProof: string;
}

// Dummy data for pending reservations
const pendingReservations: Reservation[] = [
  {
    id: "1",
    clientName: "Carlos Rodríguez",
    email: "carlos@example.com",
    date: "2024-03-15",
    time: "14:00",
    duration: 2,
    room: "Sala 1",
    status: "Revisar",
    paymentProof: "https://placehold.co/600x400",
  },
  {
    id: "4",
    clientName: "Ana Jiménez",
    email: "ana@example.com",
    date: "2024-03-18",
    time: "09:00",
    duration: 2,
    room: "Sala 2",
    status: "Revisar",
    paymentProof: "https://placehold.co/600x400",
  },
];

export default function AdminDashboard() {
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const handleStatusChange = (newStatus: string) => {
    if (!selectedReservation) return;

    // In a real app, this would update the database
    toast({
      title: `Reserva ${newStatus === "Aprobada" ? "aprobada" : "rechazada"}`,
      description: `Se ha ${
        newStatus === "Aprobada" ? "aprobado" : "rechazado"
      } la reserva de ${selectedReservation.clientName}.`,
    });

    setIsModalOpen(false);
  };

  const openReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout title="Panel de Administración">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas del Día
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              +10% comparado con ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡125,000</div>
            <p className="text-xs text-muted-foreground">
              +15% comparado con el mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Horas Reservadas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +5% comparado con la semana anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Nuevos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +18% comparado con el mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Reservas Pendientes</CardTitle>
            <CardDescription>
              Lista de reservas que requieren confirmación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReservations.length > 0 ? (
              <div className="divide-y">
                {pendingReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 px-2 rounded"
                    onClick={() => openReservationDetails(reservation)}
                  >
                    <div>
                      <p className="font-medium">{reservation.clientName}</p>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(reservation.date)}</span>
                        <span>•</span>
                        <span>{reservation.time}</span>
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
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No hay reservas pendientes en este momento
              </p>
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
                  <p>{selectedReservation.email}</p>
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
                      width={500} // Set an appropriate width for the container
                      height={160} // h-40 corresponds to 160px
                      className="w-full rounded-md"
                      style={{ objectFit: "cover" }} // Next.js Image needs style for object-fit
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
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AdminLayout>
  );
}
