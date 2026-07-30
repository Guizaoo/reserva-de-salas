import { deleteRoom, updateRoom } from "@/lib/data/rooms";
import { hasPostgresErrorCode } from "@/lib/db/errors";
import {
  roomIdSchema,
  updateRoomSchema,
} from "@/lib/validations/room";

type RoomRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RoomRouteContext,
) {
  const { id } = await params;
  const idResult = roomIdSchema.safeParse(id);

  if (!idResult.success) {
    return Response.json(
      { error: "O identificador da sala é inválido." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = updateRoomSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.flatten();

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
    const room = await updateRoom(idResult.data, result.data);

    if (!room) {
      return Response.json(
        { error: "Sala não encontrada." },
        { status: 404 },
      );
    }

    return Response.json({ data: room });
  } catch (error) {
    if (hasPostgresErrorCode(error, "23505")) {
      return Response.json(
        { error: "Já existe uma sala com esse nome." },
        { status: 409 },
      );
    }

    console.error(`[PATCH /api/rooms/${id}]`, error);

    return Response.json(
      { error: "Não foi possível atualizar a sala." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RoomRouteContext,
) {
  const { id } = await params;
  const idResult = roomIdSchema.safeParse(id);

  if (!idResult.success) {
    return Response.json(
      { error: "O identificador da sala é inválido." },
      { status: 400 },
    );
  }

  try {
    const room = await deleteRoom(idResult.data);

    if (!room) {
      return Response.json(
        { error: "Sala não encontrada." },
        { status: 404 },
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (hasPostgresErrorCode(error, "23503")) {
      return Response.json(
        {
          error:
            "Não é possível excluir esta sala porque ela possui reservas.",
        },
        { status: 409 },
      );
    }

    console.error(`[DELETE /api/rooms/${id}]`, error);

    return Response.json(
      { error: "Não foi possível excluir a sala." },
      { status: 500 },
    );
  }
}
