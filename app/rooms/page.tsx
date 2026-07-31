import type { Metadata } from "next";

import ReservationDashboard from "@/app/ui/reservation-dashboard";

export const metadata: Metadata = {
  title: "Salas | Reserva de Salas",
  description: "Cadastre, edite e exclua os espaços disponíveis.",
};

export default function RoomsPage() {
  return <ReservationDashboard view="rooms" />;
}
