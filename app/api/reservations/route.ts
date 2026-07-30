import type { NextRequest } from "next/server";

import {
  createReservation,
  listReservations,
} from "@/lib/data/reservations";
import { hasPostgresErrorCode } from "@/lib/db/errors";
import { createReservationSchema } from "@/lib/validations/reservation";
import { roomIdSchema } from "@/lib/validations/room";

// GET /api/reservations lista todas as reservas.
// GET /api/reservations?roomId=UUID filtra a listagem por sala.
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId") ?? undefined;

  // Quando o filtro é enviado, valida seu formato antes de consultar o banco.
  if (roomId) {
    const idResult = roomIdSchema.safeParse(roomId);

    if (!idResult.success) {
      return Response.json(
        { error: "O identificador da sala é inválido." },
        { status: 400 },
      );
    }
  }

  try {
    const reservations = await listReservations(roomId);

    return Response.json({ data: reservations });
  } catch (error) {
    console.error("[GET /api/reservations]", error);

    return Response.json(
      { error: "Não foi possível listar as reservas." },
      { status: 500 },
    );
  }
}

// POST /api/reservations cria uma reserva depois das validações.
export async function POST(request: Request) {
  let body: unknown;

  // Um corpo que não seja JSON válido recebe 400 Bad Request.
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  // O Zod valida campos, tipos, UUID, datas e a relação fim > início.
  const validationResult = createReservationSchema.safeParse(body);

  if (!validationResult.success) {
    const errors = validationResult.error.flatten();

    return Response.json(
      {
        error: "Os dados enviados são inválidos.",
        fields: errors.fieldErrors,
        form: errors.formErrors,
      },
      { status: 422 },
    );
  }

  try {
    // A camada de dados verifica sala, capacidade e conflito na transação.
    const result = await createReservation(validationResult.data);

    if (result.status === "room_not_found") {
      return Response.json(
        { error: "Sala não encontrada." },
        { status: 404 },
      );
    }

    if (result.status === "capacity_exceeded") {
      return Response.json(
        {
          error: `A sala comporta no máximo ${result.roomCapacity} participantes.`,
          roomCapacity: result.roomCapacity,
        },
        { status: 422 },
      );
    }

    if (result.status === "time_conflict") {
      return Response.json(
        {
          error: "A sala já possui uma reserva nesse intervalo.",
          conflict: result.conflictingReservation,
        },
        { status: 409 },
      );
    }

    return Response.json(
      { data: result.reservation },
      { status: 201 },
    );
  } catch (error) {
    // 40001 é uma falha de serialização causada por operações concorrentes.
    // 23P01 será usado pela constraint final de sobreposição do PostgreSQL.
    if (
      hasPostgresErrorCode(error, "40001") ||
      hasPostgresErrorCode(error, "23P01")
    ) {
      return Response.json(
        {
          error:
            "Não foi possível reservar esse horário porque ocorreu um conflito.",
        },
        { status: 409 },
      );
    }

    console.error("[POST /api/reservations]", error);

    return Response.json(
      { error: "Não foi possível criar a reserva." },
      { status: 500 },
    );
  }
}
