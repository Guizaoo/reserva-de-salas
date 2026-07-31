import type { Metadata } from "next";

import ReservationDashboard from "@/app/ui/reservation-dashboard";

export const metadata: Metadata = {
  title: "Reservas | Reserva de Salas",
  description: "Consulte e gerencie as reservas de horários.",
};

export default function ReservationsPage() {
  return <ReservationDashboard view="reservations" />;
}
