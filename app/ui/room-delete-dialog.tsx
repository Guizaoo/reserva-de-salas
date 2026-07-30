"use client";

import { useState } from "react";

type RoomDeleteDialogProps = {
  room: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onDeleted: () => void;
};

type DeleteRoomErrorResponse = {
  error?: string;
};

export default function RoomDeleteDialog({
  room,
  onClose,
  onDeleted,
}: RoomDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as DeleteRoomErrorResponse;
        setError(payload.error ?? "Não foi possível excluir a sala.");
        return;
      }

      // O DELETE retorna 204 e não possui JSON para ser lido.
      onDeleted();
    } catch {
      setError("Não foi possível se conectar ao servidor.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 px-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-room-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="grid size-11 place-items-center rounded-xl bg-red-50 text-lg font-bold text-red-600">
          !
        </div>

        <h2
          id="delete-room-title"
          className="mt-5 text-xl font-bold tracking-tight text-zinc-900"
        >
          Excluir sala?
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Você está prestes a excluir <strong>{room.name}</strong>. Essa ação
          não poderá ser desfeita.
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="h-11 flex-1 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="h-11 flex-1 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Excluindo..." : "Excluir sala"}
          </button>
        </div>
      </div>
    </div>
  );
}
