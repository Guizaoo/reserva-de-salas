import { createRoom, listRooms } from "@/lib/data/rooms";
import { hasPostgresErrorCode } from "@/lib/db/errors";
import { createRoomSchema } from "@/lib/validations/room";

export async function GET() {
  try {
    const rooms = await listRooms();

    return Response.json({ data: rooms });
  } catch (error) {
    console.error("[GET /api/rooms]", error);

    return Response.json(
      { error: "Não foi possível listar as salas." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = createRoomSchema.safeParse(body); //valida sem lançar uma exceção.

  if (!result.success) {
    return Response.json(
      {
        error: "Os dados enviados são inválidos.",
        fields: result.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const room = await createRoom(result.data);

    return Response.json({ data: room }, { status: 201 });
  } catch (error) {
    if (hasPostgresErrorCode(error, "23505")) {
      return Response.json(
        { error: "Já existe uma sala com esse nome." },
        { status: 409 },
      );
    }

    console.error("[POST /api/rooms]", error);

    return Response.json(
      { error: "Não foi possível criar a sala." },
      { status: 500 },
    );
  }
}
