"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { bookingData } = useBooking();
  const { login } = useAuth();

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      router.push('/');
    }
  }, [bookingData, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    
    try {
      // Attempt login
      const success = await login(email, password);
      
      if (success) {
        // Navigate to confirmation page
        router.push('/confirmation');
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error('Login error:', error);
      toast.error("An unexpected error occurred during login");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Placeholder for Google login 
      // In a real implementation, this would use Google OAuth
      toast.success("Google login initiated");
      
      // Simulate Google login 
      // In a real app, this would be replaced with actual Google OAuth flow
      const mockGoogleUser = {
        email: 'googleuser@example.com',
        name: 'Google User'
      };
      
      // You would typically have a separate Google login method in AuthContext
      // For now, we'll just show a success message
      toast.success("Google login successful");
      router.push('/confirmation');
    } catch (error) {
      console.error('Google login error:', error);
      toast.error("Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-black">Iniciar sesión</CardTitle>
            <CardDescription className="text-gray-600">
              Inicie sesión para completar su reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">Correo electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary text-black hover:bg-primary/80"
              >
                Iniciar sesión
              </Button>
            </form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-gray-600">O continúe con</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-black"
              onClick={handleGoogleLogin}
            >
              <FcGoogle className="h-5 w-5" />
              <span>Google</span>
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            <div className="text-sm text-gray-600">
              ¿No tiene una cuenta?{" "}
              <Link href="/register" className="text-accent hover:underline">
                Regístrese
              </Link>
            </div>
            <Link href="/" className="text-sm text-accent hover:underline">
              Volver al calendario
            </Link>
          </CardFooter>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-border py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          Music Rehearsal Scheduler &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}