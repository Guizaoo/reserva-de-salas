import "server-only";

import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import type { CreateRoomInput } from "@/lib/validations/room";

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
