"use client";

import { useEffect, useMemo, useState } from "react";

import ReservationDeleteDialog from "@/app/ui/reservation-delete-dialog";
import ReservationForm from "@/app/ui/reservation-form";
import RoomDeleteDialog from "@/app/ui/room-delete-dialog";
import RoomForm from "@/app/ui/room-form";

type Room = {
  id: string;
  name: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
};

type ReservationStatus = "upcoming" | "ongoing" | "finished";

type Reservation = {
  id: string;
  title: string;
  roomId: string;
  roomName: string;
  participantCount: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  status: ReservationStatus;
};

type ApiListResponse<T> = {
  data?: T[];
  error?: string;
};

const statusDetails: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  upcoming: {
    label: "Próxima",
    className: "bg-sky-50 text-sky-700 ring-sky-600/20",
  },
  ongoing: {
    label: "Em andamento",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  finished: {
    label: "Encerrada",
    className: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  },
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

// Esta função apenas conversa com a API e devolve dados.
// Ela não altera estados do React.
async function fetchDashboardData(selectedRoomId: string) {
  const reservationUrl = selectedRoomId
    ? `/api/reservations?roomId=${encodeURIComponent(selectedRoomId)}`
    : "/api/reservations";

  const [roomsResponse, reservationsResponse] = await Promise.all([
    fetch("/api/rooms"),
    fetch(reservationUrl),
  ]);

  const roomsPayload =
    (await roomsResponse.json()) as ApiListResponse<Room>;
  const reservationsPayload =
    (await reservationsResponse.json()) as ApiListResponse<Reservation>;

  if (!roomsResponse.ok) {
    throw new Error(
      roomsPayload.error ?? "Não foi possível buscar as salas.",
    );
  }

  if (!reservationsResponse.ok) {
    throw new Error(
      reservationsPayload.error ?? "Não foi possível buscar as reservas.",
    );
  }

  return {
    rooms: roomsPayload.data ?? [],
    reservations: reservationsPayload.data ?? [],
  };
}

export default function ReservationDashboard() {
  // Estados que guardam os dados e a situação atual da interface.
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshRequest, setRefreshRequest] = useState(0);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isReservationFormOpen, setIsReservationFormOpen] =
    useState(false);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);

  // O clique solicita uma nova execução do efeito.
  function refreshDashboard() {
    setIsLoading(true);
    setError(null);
    setRefreshRequest((currentRequest) => currentRequest + 1);
  }

  // Fecha o formulário e busca novamente as salas após criar ou editar.
  function handleRoomSaved() {
    setIsRoomFormOpen(false);
    setEditingRoom(null);
    refreshDashboard();
  }

  function closeRoomForm() {
    setIsRoomFormOpen(false);
    setEditingRoom(null);
  }

  function handleRoomDeleted() {
    setRoomToDelete(null);
    refreshDashboard();
  }

  function closeReservationForm() {
    setIsReservationFormOpen(false);
    setEditingReservation(null);
  }

  function handleReservationSaved() {
    closeReservationForm();
    refreshDashboard();
  }

  function handleReservationDeleted() {
    setReservationToDelete(null);
    refreshDashboard();
  }

  // Executa a busca inicial e repete quando o filtro de sala muda.
  useEffect(() => {
    let ignoreResult = false;

    fetchDashboardData(selectedRoomId)
      .then((dashboardData) => {
        if (ignoreResult) {
          return;
        }

        setRooms(dashboardData.rooms);
        setReservations(dashboardData.reservations);
      })
      .catch((requestError: unknown) => {
        if (ignoreResult) {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Ocorreu um erro inesperado.";

        setError(message);
      })
      .finally(() => {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      });

    // Se o filtro mudar antes da resposta, ignora o resultado antigo.
    return () => {
      ignoreResult = true;
    };
  }, [selectedRoomId, refreshRequest]);

  // Calcula os totais exibidos nos cartões sem criar novos estados.
  const reservationSummary = useMemo(() => {
    return reservations.reduce(
      (summary, reservation) => {
        summary[reservation.status] += 1;
        return summary;
      },
      { upcoming: 0, ongoing: 0, finished: 0 },
    );
  }, [reservations]);

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-zinc-950">
      <header className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-4 sm:px-8">
          <div>
            <p className="font-semibold tracking-tight">Reserva de Salas</p>
            <p className="text-xs text-zinc-500">Gestão de espaços</p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
              Visão geral
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Agenda de reservas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
              Consulte a ocupação das salas e acompanhe os próximos horários.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Atualizando..." : "Atualizar dados"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingRoom(null);
                setIsRoomFormOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            >
              + Nova sala
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingReservation(null);
                setIsReservationFormOpen(true);
              }}
              disabled={rooms.length === 0}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Nova reserva
            </button>
          </div>
        </section>

        <section
          aria-label="Resumo das reservas"
          className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            label="Salas cadastradas"
            value={rooms.length}
            detail="espaços disponíveis"
          />
          <SummaryCard
            label="Próximas"
            value={reservationSummary.upcoming}
            detail="reservas agendadas"
          />
          <SummaryCard
            label="Em andamento"
            value={reservationSummary.ongoing}
            detail="acontecendo agora"
          />
          <SummaryCard
            label="Encerradas"
            value={reservationSummary.finished}
            detail="no filtro atual"
          />
        </section>

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Salas</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Espaços disponíveis para receber reservas.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold text-zinc-900">{room.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Até {room.capacity} participantes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoom(room);
                      setIsRoomFormOpen(true);
                    }}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomToDelete(room)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Reservas
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ordenadas pelo horário de início.
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Filtrar por sala
              <select
                value={selectedRoomId}
                onChange={(event) => {
                  setIsLoading(true);
                  setError(null);
                  setSelectedRoomId(event.target.value);
                }}
                className="h-11 min-w-60 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-zinc-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Todas as salas</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div aria-live="polite">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} onRetry={refreshDashboard} />
            ) : reservations.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="divide-y divide-zinc-100">
                {reservations.map((reservation) => (
                  <ReservationItem
                    key={reservation.id}
                    reservation={reservation}
                    onEdit={() => {
                      setEditingReservation(reservation);
                      setIsReservationFormOpen(true);
                    }}
                    onDelete={() => setReservationToDelete(reservation)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {isRoomFormOpen ? (
        <RoomForm
          room={editingRoom ?? undefined}
          onClose={closeRoomForm}
          onSaved={handleRoomSaved}
        />
      ) : null}

      {roomToDelete ? (
        <RoomDeleteDialog
          room={roomToDelete}
          onClose={() => setRoomToDelete(null)}
          onDeleted={handleRoomDeleted}
        />
      ) : null}

      {isReservationFormOpen ? (
        <ReservationForm
          reservation={editingReservation ?? undefined}
          rooms={rooms}
          onClose={closeReservationForm}
          onSaved={handleReservationSaved}
        />
      ) : null}

      {reservationToDelete ? (
        <ReservationDeleteDialog
          reservation={reservationToDelete}
          onClose={() => setReservationToDelete(null)}
          onDeleted={handleReservationDeleted}
        />
      ) : null}
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  detail: string;
};

function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-3xl font-bold tracking-tight">{value}</strong>
        <span className="pb-1 text-xs text-zinc-400">{detail}</span>
      </div>
    </article>
  );
}

function ReservationItem({
  reservation,
  onEdit,
  onDelete,
}: {
  reservation: Reservation;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = statusDetails[reservation.status];
  const startsAt = new Date(reservation.startsAt);
  const endsAt = new Date(reservation.endsAt);

  return (
    <li className="grid gap-4 px-5 py-5 transition hover:bg-zinc-50/70 sm:px-6 lg:grid-cols-[150px_1fr_auto] lg:items-center">
      <div>
        <p className="text-sm font-semibold capitalize text-zinc-800">
          {dateFormatter.format(startsAt)}
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          {timeFormatter.format(startsAt)} - {timeFormatter.format(endsAt)}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-zinc-900">{reservation.title}</h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
          <span>{reservation.roomName}</span>
          <span>{reservation.participantCount} participantes</span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:justify-end">
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
        >
          {status.label}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          Excluir
        </button>
      </div>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-20 animate-pulse rounded-xl bg-zinc-100"
        />
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-56 place-items-center px-5 py-10 text-center">
      <div>
        <p className="font-semibold text-red-700">Não foi possível carregar</p>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-56 place-items-center px-5 py-10 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-orange-50 text-xl text-orange-600">
          +
        </div>
        <p className="font-semibold text-zinc-800">
          Nenhuma reserva encontrada
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Quando uma reserva for criada, ela aparecerá aqui.
        </p>
      </div>
    </div>
  );
}
