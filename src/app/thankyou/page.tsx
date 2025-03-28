"use client";
import React from "react";
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
import Link from "next/link";
import { CalendarCheck, MusicIcon, Clock, Mail } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";

export default function ThankYou() {
  const { bookingData } = useBooking();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo.png"
            alt="Backline Studios Logo"
            width={96} // Specify width (equivalent to h-24 which is roughly 96px)
            height={96} // Maintain aspect ratio
            className="mb-4"
            priority // Optional: for above-the-fold important images
          />
          <h1 className="text-4xl font-bold text-center">
            Backline Studios - Reserva de Salas
          </h1>
        </div>

        <Card className="w-full max-w-2xl">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="h-6 w-6 text-green-600" />
              <CardTitle className="text-2xl text-black">
                ¡Reserva Exitosa!
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Su solicitud de reserva ha sido recibida. Por favor espere a que
              revisemos su comprobante de pago.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MusicIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/30 to-accent/30 border-l-4 border-primary p-4 mb-6 rounded-md">
              <div className="flex">
                <Mail className="h-5 w-5 text-accent mr-2" />
                <p className="text-sm text-gray-700">
                  Su sala ha sido reservada y será confirmada una vez que
                  revisemos el comprobante de pago. Recibirá un correo
                  electrónico cuando su reserva sea confirmada.
                </p>
              </div>
            </div>

            {bookingData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-black">
                    Detalles de la Reserva
                  </h3>
                  <span className="text-sm text-gray-600">
                    #
                    {Math.floor(Math.random() * 10000)
                      .toString()
                      .padStart(4, "0")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div>
                    <p className="text-sm text-gray-600">Sala:</p>
                    <p className="font-medium text-black">{bookingData.room}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha:</p>
                    <p className="font-medium text-black">
                      {bookingData.startTime
                        ? format(
                            bookingData.startTime,
                            "EEEE, d 'de' MMMM 'de' yyyy",
                            { locale: es }
                          )
                        : "No disponible"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hora de inicio:</p>
                    <p className="font-medium text-black">
                      {bookingData.startTime
                        ? format(bookingData.startTime, "HH:mm")
                        : "No disponible"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hora de fin:</p>
                    <p className="font-medium text-black">
                      {bookingData.endTime
                        ? format(bookingData.endTime, "HH:mm")
                        : "No disponible"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-black">
                    Equipamiento Adicional
                  </h3>

                  <div className="space-y-2">
                    {bookingData.addOns
                      .filter((addon) => addon.selected)
                      .map((addon, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="text-black">{addon.name}</span>
                        </div>
                      ))}

                    {bookingData.addOns.filter((addon) => addon.selected)
                      .length === 0 && (
                      <p className="text-gray-600 italic">
                        Sin equipamiento adicional
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-600 py-8">
                <p>No se encontraron detalles de la reserva</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 items-center">
            <p className="text-sm text-gray-600 text-center">
              Para cualquier consulta, contáctenos al teléfono 8888-8888.
            </p>

            <Link href="/" className="w-full">
              <Button className="w-full bg-primary text-black hover:bg-primary/80">
                Volver al Calendario
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          Backline Studios &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
