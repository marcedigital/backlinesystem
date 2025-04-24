"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  Trash,
  Edit,
  Loader2,
  CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  couponType: "one-time" | "time-limited";
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const CouponsSettings = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);

  // Form state
  const [newCoupon, setNewCoupon] = useState<Omit<Coupon, "_id">>({
    code: "",
    discountType: "percentage",
    value: 0,
    couponType: "one-time",
    active: true,
  });

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Load coupons from API on component mount
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/coupons");

      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }

      const data = await response.json();
      setCoupons(data.coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setError("Could not load coupons. Please try again later.");
      toast({
        title: "Error",
        description: "Could not load coupons. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/coupons/toggle/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle coupon status");
      }

      const data = await response.json();

      // Update state locally
      setCoupons((prev) =>
        prev.map((coupon) =>
          coupon._id === id ? { ...coupon, active: data.active } : coupon
        )
      );

      const coupon = coupons.find((c) => c._id === id);

      toast({
        title: `Cupón ${!data.active ? "desactivado" : "activado"}`,
        description: `El cupón "${coupon?.code}" ha sido ${
          !data.active ? "desactivado" : "activado"
        }.`,
      });
    } catch (error) {
      console.error("Error toggling coupon status:", error);
      toast({
        title: "Error",
        description:
          "No se pudo cambiar el estado del cupón. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const checkExpiredCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons/check-expired", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to check expired coupons");
      }

      const data = await response.json();

      if (data.deactivatedCount > 0) {
        // If any coupons were deactivated, refresh the list
        fetchCoupons();

        toast({
          title: "Cupones expirados actualizados",
          description: `Se desactivaron ${data.deactivatedCount} cupones expirados.`,
        });
      } else {
        toast({
          title: "No hay cupones expirados",
          description: "Todos los cupones con fecha límite están vigentes.",
        });
      }
    } catch (error) {
      console.error("Error checking expired coupons:", error);
      toast({
        title: "Error",
        description: "No se pudieron verificar los cupones expirados.",
        variant: "destructive",
      });
    }
  };

  // Add this function to format date objects consistently
  const formatDateObject = (date?: string | Date): string => {
    if (!date) return "Sin fecha límite";
    return format(new Date(date), "dd/MM/yyyy", { locale: es });
  };

  // Add this function to check if a coupon date is approaching expiration
  const isCloseToExpiration = (endDate?: string | Date): boolean => {
    if (!endDate) return false;

    const end = new Date(endDate);
    const now = new Date();

    // Check if expiration is within 3 days
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    return end <= threeDaysFromNow && end >= now;
  };

  // Add this function to get the status text and color for a coupon
  const getCouponStatus = (
    coupon: Coupon
  ): { text: string; className: string } => {
    if (!coupon.active) {
      return {
        text: "Inactivo",
        className: "bg-gray-100 text-gray-800 border-gray-300",
      };
    }

    if (coupon.couponType === "time-limited") {
      const now = new Date();
      const startDate = coupon.startDate ? new Date(coupon.startDate) : null;
      const endDate = coupon.endDate ? new Date(coupon.endDate) : null;

      if (startDate && now < startDate) {
        return {
          text: "Pendiente",
          className: "bg-blue-100 text-blue-800 border-blue-300",
        };
      }

      if (endDate && now > endDate) {
        return {
          text: "Expirado",
          className: "bg-red-100 text-red-800 border-red-300",
        };
      }

      if (endDate && isCloseToExpiration(endDate)) {
        return {
          text: "Expira pronto",
          className: "bg-amber-100 text-amber-800 border-amber-300",
        };
      }
    }

    return {
      text: "Activo",
      className: "bg-green-100 text-green-800 border-green-300",
    };
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code || newCoupon.value <= 0) {
      toast({
        title: "Error al crear cupón",
        description: "Por favor complete todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    const couponData = { ...newCoupon };

    if (newCoupon.couponType === "time-limited") {
      if (!startDate || !endDate) {
        toast({
          title: "Error al crear cupón",
          description:
            "Por favor seleccione las fechas de inicio y fin para el cupón con límite de tiempo.",
          variant: "destructive",
        });
        return;
      }

      couponData.startDate = startDate;
      couponData.endDate = endDate;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create coupon");
      }

      const newCouponData = await response.json();

      // Add the new coupon to state
      setCoupons((prev) => [newCouponData, ...prev]);

      // Reset form
      setNewCoupon({
        code: "",
        discountType: "percentage",
        value: 0,
        couponType: "one-time",
        active: true,
      });
      setStartDate("");
      setEndDate("");

      toast({
        title: "Cupón creado",
        description: `El cupón "${newCouponData.code}" ha sido creado exitosamente.`,
      });
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo crear el cupón. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCoupon = async () => {
    if (!couponToEdit) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/coupons/${couponToEdit._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...couponToEdit,
          startDate:
            couponToEdit.couponType === "time-limited" ? startDate : undefined,
          endDate:
            couponToEdit.couponType === "time-limited" ? endDate : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update coupon");
      }

      const updatedCoupon = await response.json();

      // Update coupon in state
      setCoupons((prev) =>
        prev.map((coupon) =>
          coupon._id === updatedCoupon._id ? updatedCoupon : coupon
        )
      );

      // Reset edit state
      setCouponToEdit(null);
      setStartDate("");
      setEndDate("");

      toast({
        title: "Cupón actualizado",
        description: `El cupón "${updatedCoupon.code}" ha sido actualizado exitosamente.`,
      });
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el cupón. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteCoupon = (coupon: Coupon) => {
    setCouponToDelete(coupon);
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/admin/coupons/${couponToDelete._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete coupon");
      }

      // Remove the coupon from state
      setCoupons((prev) =>
        prev.filter((coupon) => coupon._id !== couponToDelete._id)
      );

      toast({
        title: "Cupón eliminado",
        description: `El cupón "${couponToDelete.code}" ha sido eliminado exitosamente.`,
      });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cupón. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setCouponToDelete(null);
    }
  };

  const startEditCoupon = (coupon: Coupon) => {
    setCouponToEdit(coupon);
    setStartDate(
      coupon.startDate ? format(new Date(coupon.startDate), "yyyy-MM-dd") : ""
    );
    setEndDate(
      coupon.endDate ? format(new Date(coupon.endDate), "yyyy-MM-dd") : ""
    );
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return "Sin fecha límite";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: es });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gestión de Cupones</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkExpiredCoupons}
            className="gap-1"
          >
            <CalendarIcon className="h-4 w-4" />
            Verificar Expirados
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {couponToEdit ? "Editar Cupón" : "Crear Nuevo Cupón"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Código del Cupón</Label>
              <Input
                id="coupon-code"
                placeholder="Ej. VERANO2023"
                value={couponToEdit ? couponToEdit.code : newCoupon.code}
                onChange={(e) =>
                  couponToEdit
                    ? setCouponToEdit({
                        ...couponToEdit,
                        code: e.target.value.toUpperCase(),
                      })
                    : setNewCoupon({
                        ...newCoupon,
                        code: e.target.value.toUpperCase(),
                      })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-value">Valor del Descuento</Label>
              <div className="flex gap-2">
                <Input
                  id="discount-value"
                  type="number"
                  placeholder="Ej. 10"
                  value={
                    couponToEdit ? couponToEdit.value : newCoupon.value || ""
                  }
                  onChange={(e) =>
                    couponToEdit
                      ? setCouponToEdit({
                          ...couponToEdit,
                          value: Number(e.target.value),
                        })
                      : setNewCoupon({
                          ...newCoupon,
                          value: Number(e.target.value),
                        })
                  }
                  disabled={isSubmitting}
                />
                <Select
                  value={
                    couponToEdit
                      ? couponToEdit.discountType
                      : newCoupon.discountType
                  }
                  onValueChange={(value: "percentage" | "fixed") =>
                    couponToEdit
                      ? setCouponToEdit({
                          ...couponToEdit,
                          discountType: value,
                        })
                      : setNewCoupon({ ...newCoupon, discountType: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de descuento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto Fijo (₡)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-type">Tipo de Cupón</Label>
              <Select
                value={
                  couponToEdit ? couponToEdit.couponType : newCoupon.couponType
                }
                onValueChange={(value: "one-time" | "time-limited") =>
                  couponToEdit
                    ? setCouponToEdit({ ...couponToEdit, couponType: value })
                    : setNewCoupon({ ...newCoupon, couponType: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de cupón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">Un solo uso</SelectItem>
                  <SelectItem value="time-limited">Periodo limitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="coupon-active"
                  checked={
                    couponToEdit ? couponToEdit.active : newCoupon.active
                  }
                  onCheckedChange={(checked) =>
                    couponToEdit
                      ? setCouponToEdit({ ...couponToEdit, active: checked })
                      : setNewCoupon({ ...newCoupon, active: checked })
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="coupon-active">Cupón Activo</Label>
              </div>
            </div>

            {(couponToEdit ? couponToEdit.couponType : newCoupon.couponType) ===
              "time-limited" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha de Inicio</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha de Fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          {couponToEdit ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCouponToEdit(null);
                  setStartDate("");
                  setEndDate("");
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleEditCoupon} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Cupón"
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAddCoupon}
              className="gap-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Crear Cupón
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <div>
        <h4 className="text-base font-medium mb-2">Cupones Existentes</h4>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Validez</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <span className="mt-2 block text-sm text-muted-foreground">
                      Cargando cupones...
                    </span>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-destructive"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No hay cupones disponibles
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.discountType === "percentage"
                        ? `${coupon.value}%`
                        : `₡${coupon.value.toLocaleString("es-CR")}`}
                    </TableCell>
                    <TableCell>
                      {coupon.couponType === "one-time"
                        ? "Un solo uso"
                        : "Periodo limitado"}
                    </TableCell>
                    <TableCell>
                      {coupon.couponType === "time-limited"
                        ? `${formatDateDisplay(
                            coupon.startDate
                          )} - ${formatDateDisplay(coupon.endDate)}`
                        : "Sin fecha límite"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`coupon-${coupon._id}-active`}
                          checked={coupon.active}
                          onCheckedChange={() => handleToggleActive(coupon._id)}
                        />
                        <Label htmlFor={`coupon-${coupon._id}-active`}>
                          {coupon.active ? "Activo" : "Inactivo"}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditCoupon(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => confirmDeleteCoupon(coupon)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Está seguro de eliminar este cupón?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará
                                permanentemente el cupón "{couponToDelete?.code}
                                ".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteCoupon}
                                disabled={isDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Eliminando...
                                  </>
                                ) : (
                                  "Eliminar"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CouponsSettings;
