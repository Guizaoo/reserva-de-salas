"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type ReservationFormProps = {
  reservation?: {
    id: string;
    title: string;
    roomId: string;
    participantCount: number;
    startsAt: string;
    endsAt: string;
  };
  rooms: {
    id: string;
    name: string;
    capacity: number;
  }[];
  onClose: () => void;
  onSaved: () => void;
};

type ReservationFormFields = {
  title?: string[];
  roomId?: string[];
  participantCount?: string[];
  startsAt?: string[];
  endsAt?: string[];
};

type ReservationResponse = {
  data?: {
    id: string;
  };
  error?: string;
  fields?: ReservationFormFields;
};

export default function ReservationForm({
  reservation,
  rooms,
  onClose,
  onSaved,
}: ReservationFormProps) {
  const isEditing = reservation !== undefined;

  const [title, setTitle] = useState(reservation?.title ?? "");
  const [roomId, setRoomId] = useState(
    reservation?.roomId ?? rooms[0]?.id ?? "",
  );
  const [participantCount, setParticipantCount] = useState(
    reservation ? String(reservation.participantCount) : "",
  );
  const [startsAt, setStartsAt] = useState(
    reservation ? toDateTimeLocalValue(reservation.startsAt) : "",
  );
  const [endsAt, setEndsAt] = useState(
    reservation ? toDateTimeLocalValue(reservation.endsAt) : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] =
    useState<ReservationFormFields>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(endsAt);

    // Feedback imediato antes de enviar, mantendo a validação principal na API.
    if (endsAtDate <= startsAtDate) {
      setFieldErrors({
        endsAt: ["O término deve ser posterior ao início."],
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch(
        isEditing
          ? `/api/reservations/${reservation.id}`
          : "/api/reservations",
        {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          roomId,
          participantCount: Number(participantCount),
          // datetime-local usa o fuso do navegador; toISOString envia em UTC.
          startsAt: startsAtDate.toISOString(),
          endsAt: endsAtDate.toISOString(),
        }),
        },
      );

      const payload = (await response.json()) as ReservationResponse;

      if (!response.ok) {
        setError(
          payload.error ??
            `Não foi possível ${isEditing ? "atualizar" : "criar"} a reserva.`,
        );
        setFieldErrors(payload.fields ?? {});
        return;
      }

      onSaved();
    } catch {
      setError("Não foi possível se conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-form-title"
    >
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-zinc-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              {isEditing ? "Editar reserva" : "Nova reserva"}
            </p>
            <h2
              id="reservation-form-title"
              className="mt-1 text-2xl font-bold tracking-tight"
            >
              {isEditing ? "Atualizar agendamento" : "Agendar horário"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {isEditing
                ? "Altere os dados necessários e salve o agendamento."
                : "Escolha uma sala e defina o período da reunião."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar formulário"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
          >
            ×
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col justify-between"
        >
          <div className="space-y-5 px-6 py-6">
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                {error}
              </div>
            ) : null}

            <FormField label="Título" errors={fieldErrors.title}>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Planejamento semanal"
                required
                minLength={2}
                maxLength={120}
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-100"
              />
            </FormField>

            <FormField label="Sala" errors={fieldErrors.roomId}>
              <select
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                required
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-100"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} — até {room.capacity} pessoas
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Número de participantes"
              errors={fieldErrors.participantCount}
            >
              <input
                type="number"
                value={participantCount}
                onChange={(event) => setParticipantCount(event.target.value)}
                placeholder="Ex.: 6"
                required
                min={1}
                step={1}
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-100"
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Início" errors={fieldErrors.startsAt}>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  required
                  disabled={isSubmitting}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-100"
                />
              </FormField>

              <FormField label="Término" errors={fieldErrors.endsAt}>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  required
                  disabled={isSubmitting}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-100"
                />
              </FormField>
            </div>
          </div>

          <footer className="flex gap-3 border-t border-zinc-200 px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 flex-1 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rooms.length === 0}
              className="h-11 flex-1 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Criar reserva"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

// Converte uma data UTC da API para o formato aceito pelo datetime-local.
function toDateTimeLocalValue(isoDate: string) {
  const date = new Date(isoDate);
  const timezoneOffsetInMilliseconds =
    date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetInMilliseconds);

  return localDate.toISOString().slice(0, 16);
}

function FormField({
  label,
  errors,
  children,
}: {
  label: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      {children}
      {errors?.map((message) => (
        <span key={message} className="mt-1.5 block text-xs text-red-600">
          {message}
        </span>
      ))}
    </label>
  );
}
