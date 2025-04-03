// src/app/register/page.tsx

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const router = useRouter();
  const { signup } = useAuth();

  const validatePassword = (pwd: string): boolean => {
    const hasMinLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    return hasMinLength && hasUpper && hasNumber;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = { phoneNumber: '', password: '', confirmPassword: '' };

    if (phoneNumber && !phoneNumber.startsWith('+506')) {
      newErrors.phoneNumber = 'El número debe comenzar con +506';
    }

    if (!validatePassword(password)) {
      newErrors.password = 'Debe tener al menos 8 caracteres, una mayúscula y un número';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    try {
      setIsLoading(true);
      const success = await signup({
        firstName,
        lastName,
        email,
        password,
        phoneNumber
      });
      if (success) {
        toast.success('Registro exitoso');
        router.push('/confirmation');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    try {
      setIsLoading(true);
      // Redirect directly to Google auth with confirmation as the callback URL
      signIn('google', { 
        callbackUrl: '/confirmation'
      });
      // Note: The function will redirect, so we don't need to handle the response
    } catch (error) {
      console.error('Error en registro con Google:', error);
      toast.error('Ocurrió un error durante el registro con Google');
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    if (input && !input.startsWith('+506')) {
      input = '+506' + input.replace(/^\+?506?/, '');
    }
    setPhoneNumber(input);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-black">Crear Cuenta</CardTitle>
            <CardDescription className="text-gray-600">
              Regístrese para completar su reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-black">Nombre</Label>
                  <Input 
                    id="firstName" 
                    type="text" 
                    placeholder="Nombre" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required 
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-black">Apellido</Label>
                  <Input 
                    id="lastName" 
                    type="text" 
                    placeholder="Apellido" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">Correo electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-black">Teléfono (Opcional)</Label>
                <Input 
                  id="phoneNumber" 
                  type="tel" 
                  placeholder="+506 8888-8888" 
                  value={phoneNumber} 
                  onChange={handlePhoneChange} 
                  disabled={isLoading}
                />
                {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password" className="text-black">Contraseña</Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={!validatePassword(password) && password ? "border-red-500 focus-visible:ring-red-500" : ""}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute top-9 right-2"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <p className="text-xs text-gray-500">
                  La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.
                </p>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-black">Confirmar Contraseña</Label>
                <Input 
                  id="confirmPassword" 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary text-black hover:bg-primary/80"
                disabled={isLoading}
              >
                {isLoading ? "Procesando..." : "Registrarse"}
              </Button>
            </form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-gray-600">O regístrese con</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-black"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              <FcGoogle className="h-5 w-5" />
              <span>{isLoading ? "Conectando..." : "Google"}</span>
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            <div className="text-sm text-gray-600">
              ¿Ya tiene una cuenta?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Iniciar sesión
              </Link>
            </div>
            <Link href="/" className="text-sm text-accent hover:underline">
              Volver al calendario
            </Link>
          </CardFooter>
        </Card>
      </main>
      <footer className="bg-white border-t border-border py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          Music Rehearsal Scheduler &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}