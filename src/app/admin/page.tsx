"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MusicIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Inner component that uses router
function AdminLoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated, login } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Call the async login function from AdminAuthContext
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: "Acceso concedido",
          description: "Bienvenido al panel de administración.",
          variant: "default",
        });
        router.push('/admin/dashboard');
      } else {
        setError("Credenciales inválidas. Intente de nuevo.");
        toast({
          title: "Error de acceso",
          description: "Credenciales inválidas. Intente de nuevo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Ocurrió un error al intentar iniciar sesión.");
      toast({
        title: "Error",
        description: "Ocurrió un error al intentar iniciar sesión.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <MusicIcon className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
        <CardDescription>
          Ingrese sus credenciales para acceder
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="admin@ejemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
            </div>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white"
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Iniciando sesión</span>
                <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Main component that wraps the content with Suspense
export default function AdminLogin() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="mb-8">
        <Image 
          src="/logo.png" 
          alt="Backline Studios Logo" 
          width={150} 
          height={50} 
          priority
        />
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <AdminLoginContent />
      </Suspense>
      
      <div className="mt-8 text-sm text-gray-500">
        Backline Studios © {new Date().getFullYear()}
      </div>
    </div>
  );
}