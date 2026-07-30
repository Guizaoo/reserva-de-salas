import ReservationDashboard from "@/app/ui/reservation-dashboard";

// A página continua sendo um Server Component.
// A parte interativa fica isolada no ReservationDashboard.
export default function Home() {
  return <ReservationDashboard />;
}
