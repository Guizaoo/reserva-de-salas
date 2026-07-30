import { z } from "zod";

// Valida o UUID recebido na URL /api/reservations/:id.
export const reservationIdSchema = z.uuid(
  "O identificador da reserva é inválido.",
);

// Campos e regras individuais compartilhados pela criação e pela edição.
const reservationFields = {
  title: z
    .string()
    .trim()
    .min(2, "O título deve ter pelo menos 2 caracteres.")
    .max(120, "O título deve ter no máximo 120 caracteres."),
  roomId: z.uuid("O identificador da sala é inválido."),
  participantCount: z
    .number()
    .int("O número de participantes deve ser inteiro.")
    .positive("O número de participantes deve ser maior que zero."),
  startsAt: z.iso.datetime({
    offset: true,
    error: "A data de início deve estar no formato ISO 8601.",
  }),
  endsAt: z.iso.datetime({
    offset: true,
    error: "A data de término deve estar no formato ISO 8601.",
  }),
};

// Na criação, todos os campos são obrigatórios.
export const createReservationSchema = z
  .object(reservationFields)
  .superRefine((data, context) => {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    // Bloqueia horários iguais e término anterior ao início.
    if (endsAt <= startsAt) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "O término deve ser posterior ao início.",
      });
    }
  });

// Na edição, todos os campos são opcionais, mas pelo menos um deve ser enviado.
export const updateReservationSchema = z
  .object(reservationFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualizar.",
  })
  .superRefine((data, context) => {
    // Se as duas datas forem enviadas juntas, já podemos compará-las aqui.
    // Se apenas uma for enviada, a comparação será feita com a data atual no banco.
    if (data.startsAt && data.endsAt) {
      const startsAt = new Date(data.startsAt);
      const endsAt = new Date(data.endsAt);

      if (endsAt <= startsAt) {
        context.addIssue({
          code: "custom",
          path: ["endsAt"],
          message: "O término deve ser posterior ao início.",
        });
      }
    }
  });

// Tipos TypeScript gerados automaticamente a partir das regras do Zod.
export type CreateReservationInput = z.infer<
  typeof createReservationSchema
>;

export type UpdateReservationInput = z.infer<
  typeof updateReservationSchema
>;
