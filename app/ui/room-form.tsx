"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";

type RoomFormProps = {
  room?: {
    id: string;
    name: string;
    capacity: number;
  };
  onClose: () => void;
  onSaved: () => void;
};

type RoomResponse = {
  data?: {
    id: string;
    name: string;
    capacity: number;
  };
  error?: string;
  fields?: {
    name?: string[];
    capacity?: string[];
  };
};

export default function RoomForm({
  room,
  onClose,
  onSaved,
}: RoomFormProps) {
  const isEditing = room !== undefined;

  // Inputs controlados: o React guarda o valor atual de cada campo.
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(
    room ? String(room.capacity) : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    NonNullable<RoomResponse["fields"]>
  >({});

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Impede o comportamento padrão, que recarregaria a página inteira.
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch(
        isEditing ? `/api/rooms/${room.id}` : "/api/rooms",
        {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          capacity: Number(capacity),
        }),
        },
      );

      const payload = (await response.json()) as RoomResponse;

      if (!response.ok) {
        setError(
          payload.error ??
            `Não foi possível ${isEditing ? "atualizar" : "criar"} a sala.`,
        );
        setFieldErrors(payload.fields ?? {});
        return;
      }

      // Avisa o componente pai para fechar o painel e atualizar os dados.
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
      aria-labelledby="room-form-title"
    >
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-zinc-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              {isEditing ? "Editar sala" : "Nova sala"}
            </p>
            <h2
              id="room-form-title"
              className="mt-1 text-2xl font-bold tracking-tight"
            >
              {isEditing ? "Atualizar espaço" : "Cadastrar espaço"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {isEditing
                ? "Altere o nome ou a capacidade máxima da sala."
                : "Informe um nome único e a capacidade máxima da sala."}
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
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            ) : null}

            <label className="block">
              <span className="text-sm font-semibold text-zinc-800">
                Nome da sala
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Sala Atlântico"
                required
                minLength={2}
                maxLength={100}
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-100"
              />
              {fieldErrors.name?.map((message) => (
                <span
                  key={message}
                  className="mt-1.5 block text-xs text-red-600"
                >
                  {message}
                </span>
              ))}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-800">
                Capacidade
              </span>
              <input
                type="number"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="Ex.: 8"
                required
                min={1}
                step={1}
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-zinc-100"
              />
              <p className="mt-1.5 text-xs text-zinc-500">
                Número máximo de participantes permitidos.
              </p>
              {fieldErrors.capacity?.map((message) => (
                <span
                  key={message}
                  className="mt-1.5 block text-xs text-red-600"
                >
                  {message}
                </span>
              ))}
            </label>
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
              disabled={isSubmitting}
              className="h-11 flex-1 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Criar sala"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
