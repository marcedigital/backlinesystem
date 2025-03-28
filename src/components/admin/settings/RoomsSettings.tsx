"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, RefreshCw, Unlink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type Room = {
  id: string;
  name: string;
  isConnected: boolean;
  calendarName?: string;
  lastSync?: string;
};

const RoomsSettings = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Sala 1', isConnected: true, calendarName: 'Sala de Ensayo 1', lastSync: '2023-06-15T14:30:00' },
    { id: '2', name: 'Sala 2', isConnected: false },
    { id: '3', name: 'Sala 3', isConnected: false },
  ]);

  const handleConnect = (roomId: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, isConnected: true, calendarName: `Sala de Ensayo ${room.name.split(' ')[1]}`, lastSync: new Date().toISOString() } 
        : room
    ));
    
    toast({
      title: "Calendario conectado",
      description: "La sala ha sido conectada a Google Calendar exitosamente.",
    });
  };

  const handleDisconnect = (roomId: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, isConnected: false, calendarName: undefined, lastSync: undefined } 
        : room
    ));
    
    toast({
      title: "Calendario desconectado",
      description: "La sala ha sido desconectada de Google Calendar.",
    });
  };

  const handleResync = (roomId: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, lastSync: new Date().toISOString() } 
        : room
    ));
    
    toast({
      title: "Calendario resincronizado",
      description: "La sincronización con Google Calendar ha sido actualizada.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Configuración de Salas</h3>
      </div>
      
      <div className="border rounded-md divide-y">
        {rooms.map((room) => (
          <div key={room.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium">{room.name}</h4>
              {room.isConnected && (
                <div className="mt-1 space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Calendario: {room.calendarName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                      <Check className="mr-1 h-3 w-3" /> Conectado
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Última sincronización: {new Date(room.lastSync!).toLocaleString('es-CR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {!room.isConnected ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleConnect(room.id)}
                >
                  <Calendar className="h-4 w-4" />
                  Conectar a Google Calendar
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleResync(room.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Resincronizar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                    onClick={() => handleDisconnect(room.id)}
                  >
                    <Unlink className="h-4 w-4" />
                    Desconectar
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsSettings;
