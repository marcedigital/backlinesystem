// src/components/admin/settings/RoomsSettings.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, RefreshCw, Unlink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Room = {
  id: string;
  name: string;
  description?: string;
  hourlyRate: number;
  additionalHourRate: number;
  isActive: boolean;
  googleCalendarId: string;
  googleCalendarSyncEnabled: boolean;
  lastSyncTime?: string;
};

const RoomsSettings = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/rooms');
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      
      if (data.rooms && data.rooms.length > 0) {
        setRooms(data.rooms);
      } else {
        // Initialize with default rooms if none exist
        setRooms([
          {
            id: 'room1', 
            name: 'Sala 1', 
            description: 'Sala de ensayos principal',
            hourlyRate: 10000,
            additionalHourRate: 5000,
            isActive: true,
            googleCalendarId: '0300d6d6eb5334024dad813d7a111841f5d5a504311ca64091eee55f8241c72b@group.calendar.google.com',
            googleCalendarSyncEnabled: false
          },
          {
            id: 'room2', 
            name: 'Sala 2', 
            description: 'Sala de ensayos secundaria',
            hourlyRate: 10000,
            additionalHourRate: 5000,
            isActive: true,
            googleCalendarId: 'b603cdcf972a68f8fb6254ae3a9918c2aca89987cb03d5a41eae32b6f25d180c@group.calendar.google.com',
            googleCalendarSyncEnabled: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las salas. Inténtelo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSync = async (roomId: string) => {
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}/toggle-sync`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle room sync');
      }
      
      const data = await response.json();
      
      // Update state locally
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { 
              ...room, 
              googleCalendarSyncEnabled: data.googleCalendarSyncEnabled,
              lastSyncTime: data.lastSyncTime
            } 
          : room
      ));
      
      const room = rooms.find(r => r.id === roomId);
      
      toast({
        title: `Sincronización ${data.googleCalendarSyncEnabled ? 'activada' : 'desactivada'}`,
        description: `La sincronización para "${room?.name}" ha sido ${data.googleCalendarSyncEnabled ? 'activada' : 'desactivada'}.`,
      });
    } catch (error) {
      console.error('Error toggling room sync:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de sincronización. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      const response = await fetch('/api/rooms/calendar-sync', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync calendars');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Sincronización completada",
          description: `Se han sincronizado ${data.syncedRooms} salas con Google Calendar.`,
        });
        
        // Refresh rooms to get updated sync times
        fetchRooms();
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing calendars:', error);
      toast({
        title: "Error",
        description: "No se pudieron sincronizar los calendarios. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async () => {
    if (!roomToEdit) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomToEdit)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update room');
      }
      
      const data = await response.json();
      
      // Update room in state
      setRooms(prev => prev.map(room => 
        room.id === data.room.id ? data.room : room
      ));
      
      // Reset edit state
      setRoomToEdit(null);
      
      toast({
        title: "Sala actualizada",
        description: `La sala "${data.room.name}" ha sido actualizada exitosamente.`,
      });
    } catch (error) {
      console.error('Error updating room:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la sala. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Configuración de Salas</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isLoading || isSyncing || !rooms.some(room => room.googleCalendarSyncEnabled)}
          className="flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sincronizar Calendarios
            </>
          )}
        </Button>
      </div>
      
      {roomToEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editar Sala</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Nombre de la Sala</Label>
                <Input
                  id="room-name"
                  value={roomToEdit.name}
                  onChange={(e) => setRoomToEdit({...roomToEdit, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room-hourly-rate">Tarifa por Hora (₡)</Label>
                <Input
                  id="room-hourly-rate"
                  type="number"
                  value={roomToEdit.hourlyRate}
                  onChange={(e) => setRoomToEdit({...roomToEdit, hourlyRate: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room-additional-rate">Tarifa Hora Adicional (₡)</Label>
                <Input
                  id="room-additional-rate"
                  type="number"
                  value={roomToEdit.additionalHourRate}
                  onChange={(e) => setRoomToEdit({...roomToEdit, additionalHourRate: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room-calendar-id">ID de Google Calendar</Label>
                <Input
                  id="room-calendar-id"
                  value={roomToEdit.googleCalendarId}
                  onChange={(e) => setRoomToEdit({...roomToEdit, googleCalendarId: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room-description">Descripción</Label>
              <Textarea
                id="room-description"
                value={roomToEdit.description || ''}
                onChange={(e) => setRoomToEdit({...roomToEdit, description: e.target.value})}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setRoomToEdit(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </Card>
      ) : null}
      
      <div className="border rounded-md divide-y">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium">{room.name}</h4>
                {room.description && (
                  <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
                )}
                <div className="mt-1">
                  <span className="text-sm">
                    Tarifa: <strong>{room.hourlyRate.toLocaleString('es-CR')}</strong> primera hora, 
                    <strong> {room.additionalHourRate.toLocaleString('es-CR')}</strong> por hora adicional
                  </span>
                </div>
                {room.googleCalendarSyncEnabled && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                      <Check className="mr-1 h-3 w-3" /> Sincronización Activa
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Última sincronización: {formatDate(room.lastSyncTime)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setRoomToEdit(room)}
                >
                  Editar
                </Button>
                
                <Button 
                  variant={room.googleCalendarSyncEnabled ? "outline" : "default"}
                  size="sm"
                  className={`flex items-center gap-1 ${room.googleCalendarSyncEnabled ? 'text-red-600 hover:text-red-600' : ''}`}
                  onClick={() => handleToggleSync(room.id)}
                >
                  {room.googleCalendarSyncEnabled ? (
                    <>
                      <Unlink className="h-4 w-4" />
                      Desconectar
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Conectar a Google Calendar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomsSettings;