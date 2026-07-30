import {
  deleteReservation,
  updateReservation,
} from "@/lib/data/reservations";
import { hasPostgresErrorCode } from "@/lib/db/errors";
import {
  reservationIdSchema,
  updateReservationSchema,
} from "@/lib/validations/reservation";

// No Next.js 16, os parâmetros de uma rota dinâmica são assíncronos.
type ReservationRouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/reservations/:id atualiza somente os campos enviados.
export async function PATCH(
  request: Request,
  { params }: ReservationRouteContext,
) {
  const { id } = await params;

  // Valida o UUID que veio no endereço da requisição.
  const idResult = reservationIdSchema.safeParse(id);

  if (!idResult.success) {
    return Response.json(
      { error: "O identificador da reserva é inválido." },
      { status: 400 },
    );
  }

  let body: unknown;

  // Protege a API contra um corpo que não seja JSON válido.
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  // Valida os campos opcionais e impede uma atualização vazia.
  const validationResult = updateReservationSchema.safeParse(body);

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
    const result = await updateReservation(
      idResult.data,
      validationResult.data,
    );

    // Cada resultado da camada de dados vira uma resposta HTTP apropriada.
    if (result.status === "reservation_not_found") {
      return Response.json(
        { error: "Reserva não encontrada." },
        { status: 404 },
      );
    }

    if (result.status === "invalid_interval") {
      return Response.json(
        { error: "O término deve ser posterior ao início." },
        { status: 422 },
      );
    }

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

    return Response.json({ data: result.reservation });
  } catch (error) {
    // Trata tanto concorrência quanto a constraint de conflito do PostgreSQL.
    if (
      hasPostgresErrorCode(error, "40001") ||
      hasPostgresErrorCode(error, "23P01")
    ) {
      return Response.json(
        {
          error:
            "Não foi possível atualizar a reserva porque ocorreu um conflito.",
        },
        { status: 409 },
      );
    }

    console.error(`[PATCH /api/reservations/${id}]`, error);

    return Response.json(
      { error: "Não foi possível atualizar a reserva." },
      { status: 500 },
    );
  }
}

// DELETE /api/reservations/:id exclui uma reserva existente.
export async function DELETE(
  _request: Request,
  { params }: ReservationRouteContext,
) {
  const { id } = await params;
  const idResult = reservationIdSchema.safeParse(id);

  if (!idResult.success) {
    return Response.json(
      { error: "O identificador da reserva é inválido." },
      { status: 400 },
    );
  }

  try {
    const reservation = await deleteReservation(idResult.data);

    if (!reservation) {
      return Response.json(
        { error: "Reserva não encontrada." },
        { status: 404 },
      );
    }

    // 204 significa que a exclusão funcionou e não existe corpo na resposta.
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE /api/reservations/${id}]`, error);

    return Response.json(
      { error: "Não foi possível excluir a reserva." },
      { status: 500 },
    );
  }
}
