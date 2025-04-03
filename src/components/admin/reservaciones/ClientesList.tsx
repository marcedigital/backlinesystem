// src/components/admin/reservaciones/ClientesList.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  totalBookings: number;
  totalSpent: number;
  googleId?: string;
  createdAt: string;
}

const ClientesList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/users?page=${page}&limit=10`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        
        const data = await response.json();
        setCustomers(data.users);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setError('Error fetching customers. Please try again later.');
        toast({
          title: "Error",
          description: "Failed to load customer data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [page, toast]);

  const filteredCustomers = customers.filter(customer => 
    customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phoneNumber && customer.phoneNumber.includes(searchQuery))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Método de Registro</TableHead>
                    <TableHead>Total Reservas</TableHead>
                    <TableHead>Total Gastado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No se encontraron clientes con esa búsqueda
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phoneNumber || "-"}</TableCell>
                        <TableCell>
                          {customer.googleId ? (
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Google
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Email
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{customer.totalBookings}</TableCell>
                        <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(page - 1)}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={page === pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(page + 1)}
                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientesList;