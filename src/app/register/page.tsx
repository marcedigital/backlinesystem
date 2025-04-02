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


export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    if (!phoneNumber.startsWith('+506')) {
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
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    if (!input.startsWith('+506')) {
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
                  <Input id="firstName" type="text" placeholder="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-black">Apellido</Label>
                  <Input id="lastName" type="text" placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-black">Teléfono (Opcional)</Label>
                <Input id="phoneNumber" type="tel" placeholder="+506 8888-8888" value={phoneNumber} onChange={handlePhoneChange} />
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
                  className={!validatePassword(password) ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                <button
                  type="button"
                  className="absolute top-9 right-2"
                  onClick={() => setShowPassword(!showPassword)}
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
                <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/80">Registrarse</Button>
            </form>
            {/* ... Google signup y resto igual */}
          </CardContent>
          {/* ... Footer igual */}
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