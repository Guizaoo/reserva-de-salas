import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import type {
  CreateRoomInput,
  UpdateRoomInput,
} from "@/lib/validations/room";

export async function listRooms() {
  return db.select().from(rooms).orderBy(asc(rooms.name));
}

export async function createRoom(input: CreateRoomInput) {
  const [room] = await db
    .insert(rooms)
    .values({
      name: input.name,
      capacity: input.capacity,
    })
    .returning();

  return room;
}

export async function updateRoom(id: string, input: UpdateRoomInput) {
  const [room] = await db
    .update(rooms)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, id))
    .returning();

  return room ?? null;
}

export async function deleteRoom(id: string) {
  const [room] = await db
    .delete(rooms)
    .where(eq(rooms.id, id))
    .returning({ id: rooms.id });

  return room ?? null;
}
