import "server-only";

import { and, asc, eq, gt, lt, ne } from "drizzle-orm"; // operacoes SQL

import { db } from "@/lib/db";
import { reservations, rooms } from "@/lib/db/schema";
import type {
  CreateReservationInput,
  UpdateReservationInput,
} from "@/lib/validations/reservation";

// Estados possíveis de uma reserva. Eles são calculados e não ficam salvos no banco.
export type ReservationStatus = "upcoming" | "ongoing" | "finished";

// Compara o horário da reserva com o momento atual para descobrir seu estado.
function getReservationStatus(
  startsAt: Date,
  endsAt: Date,
  now: Date,
): ReservationStatus {
  if (now < startsAt) {
    return "upcoming";
  }

  if (now >= endsAt) {
    return "finished";
  }

  return "ongoing";
}

// Lista todas as reservas ou filtra por uma sala quando roomId é informado.
export async function listReservations(roomId?: string) {
  // O INNER JOIN inclui o nome da sala junto aos dados de cada reserva.
  const query = db
    .select({
      id: reservations.id,
      title: reservations.title,
      roomId: reservations.roomId,
      roomName: rooms.name,
      participantCount: reservations.participantCount,
      startsAt: reservations.startsAt,
      endsAt: reservations.endsAt,
      createdAt: reservations.createdAt,
      updatedAt: reservations.updatedAt,
    })
    .from(reservations)
    .innerJoin(rooms, eq(reservations.roomId, rooms.id));

  // Se roomId existir, aplica o filtro. Nos dois casos, ordena pelo horário inicial.
  const rows = roomId
    ? await query
        .where(eq(reservations.roomId, roomId))
        .orderBy(asc(reservations.startsAt))
    : await query.orderBy(asc(reservations.startsAt));

  const now = new Date();

  // Acrescenta o status derivado a cada reserva retornada pelo banco.
  return rows.map((reservation) => ({
    ...reservation,
    status: getReservationStatus(
      reservation.startsAt,
      reservation.endsAt,
      now,
    ),
  }));
}

// Cria uma reserva somente depois de validar sala, capacidade e conflito.
export async function createReservation(input: CreateReservationInput) {
  
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);

  // A transacao agrupa todas as verificações e a inserção em uma única operação
  return db.transaction(
    async (transaction) => {
      // Procura a sala e seleciona apenas os campos necessarios para a validacao
      const [room] = await transaction
        .select({
          id: rooms.id,
          capacity: rooms.capacity,
        })
        .from(rooms)
        .where(eq(rooms.id, input.roomId))
        .limit(1);

      // Resultado usado pela API para responder 404 quando a sala não existe
      if (!room) {
        return { status: "room_not_found" } as const;
      }

      // participantes não podem ultrapassar o limite da sala
      if (input.participantCount > room.capacity) {
        return {
          status: "capacity_exceeded",
          roomCapacity: room.capacity,
        } as const;
      }

      // Regra de conflito:
      // O uso de < e > permite que uma reserva comece exatamente quando outra termina.
      const [conflictingReservation] = await transaction
        .select({
          id: reservations.id,
          title: reservations.title,
          startsAt: reservations.startsAt,
          endsAt: reservations.endsAt,
        })
        .from(reservations)
        .where(
          and(
            eq(reservations.roomId, input.roomId),
            lt(reservations.startsAt, endsAt),
            gt(reservations.endsAt, startsAt),
          ),
        )
        .limit(1);

      // Resultado de conflito
      if (conflictingReservation) {
        return {
          status: "time_conflict",
          conflictingReservation,
        } as const;
      }

      // insercao acontece quando todas as regras anteriores foram aprovadas.
      const [reservation] = await transaction
        .insert(reservations)
        .values({
          title: input.title,
          roomId: input.roomId,
          participantCount: input.participantCount,
          startsAt,
          endsAt,
        })
        .returning();

      
      return {
        status: "created",
        reservation,
      } as const;
    },
    {
      
      isolationLevel: "serializable",
      accessMode: "read write",
    },
  );
}

// Atualiza somente os campos enviados e mantém os demais valores da reserva.
export async function updateReservation(
  id: string,
  input: UpdateReservationInput,
) {
  return db.transaction(
    async (transaction) => {
      // Primeiro busca os valores atuais, pois o PATCH pode enviar apenas um campo.
      const [currentReservation] = await transaction
        .select()
        .from(reservations)
        .where(eq(reservations.id, id))
        .limit(1);

      if (!currentReservation) {
        return { status: "reservation_not_found" } as const;
      }

      // Junta cada valor novo com o valor que já estava salvo.
      const title = input.title ?? currentReservation.title;
      const roomId = input.roomId ?? currentReservation.roomId;
      const participantCount =
        input.participantCount ?? currentReservation.participantCount;
      const startsAt = input.startsAt
        ? new Date(input.startsAt)
        : currentReservation.startsAt;
      const endsAt = input.endsAt
        ? new Date(input.endsAt)
        : currentReservation.endsAt;

      // Esta verificação também cobre o caso em que apenas uma data foi alterada.
      if (endsAt <= startsAt) {
        return { status: "invalid_interval" } as const;
      }

      // Busca a capacidade da sala atual ou da nova sala enviada no PATCH.
      const [room] = await transaction
        .select({
          id: rooms.id,
          capacity: rooms.capacity,
        })
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .limit(1);

      if (!room) {
        return { status: "room_not_found" } as const;
      }

      if (participantCount > room.capacity) {
        return {
          status: "capacity_exceeded",
          roomCapacity: room.capacity,
        } as const;
      }

      // Procura conflito na mesma sala, mas ignora a própria reserva editada.
      const [conflictingReservation] = await transaction
        .select({
          id: reservations.id,
          title: reservations.title,
          startsAt: reservations.startsAt,
          endsAt: reservations.endsAt,
        })
        .from(reservations)
        .where(
          and(
            ne(reservations.id, id),
            eq(reservations.roomId, roomId),
            lt(reservations.startsAt, endsAt),
            gt(reservations.endsAt, startsAt),
          ),
        )
        .limit(1);

      if (conflictingReservation) {
        return {
          status: "time_conflict",
          conflictingReservation,
        } as const;
      }

      // Após todas as validações, atualiza a reserva e devolve o registro novo.
      const [updatedReservation] = await transaction
        .update(reservations)
        .set({
          title,
          roomId,
          participantCount,
          startsAt,
          endsAt,
          updatedAt: new Date(),
        })
        .where(eq(reservations.id, id))
        .returning();

      return {
        status: "updated",
        reservation: updatedReservation,
      } as const;
    },
    {
      isolationLevel: "serializable",
      accessMode: "read write",
    },
  );
}

// Exclui uma reserva pelo id e informa se algum registro foi encontrado.
export async function deleteReservation(id: string) {
  const [deletedReservation] = await db
    .delete(reservations)
    .where(eq(reservations.id, id))
    .returning({ id: reservations.id });

  return deletedReservation ?? null;
}
