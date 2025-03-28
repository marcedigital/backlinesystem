"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

// Dummy client data
const dummyClients = [
  {
    id: '1',
    name: 'Carlos Rodríguez',
    email: 'carlos@example.com',
    phone: '8888-1234',
    totalReservations: 3,
    totalSpent: 45000
  },
  {
    id: '2',
    name: 'María González',
    email: 'maria@example.com',
    phone: '8888-5678',
    totalReservations: 2,
    totalSpent: 30000
  },
  {
    id: '3',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '8888-9012',
    totalReservations: 5,
    totalSpent: 75000
  },
  {
    id: '4',
    name: 'Ana Jiménez',
    email: 'ana@example.com',
    phone: '8888-3456',
    totalReservations: 1,
    totalSpent: 15000
  },
  {
    id: '5',
    name: 'Pedro Mora',
    email: 'pedro@example.com',
    phone: '8888-7890',
    totalReservations: 4,
    totalSpent: 60000
  }
];

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalReservations: number;
  totalSpent: number;
}

const ClientesList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients] = useState<Client[]>(dummyClients);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full md:w-72">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Total Reservas</TableHead>
                <TableHead>Total Gastado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.totalReservations}</TableCell>
                  <TableCell>{formatCurrency(client.totalSpent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientesList;
