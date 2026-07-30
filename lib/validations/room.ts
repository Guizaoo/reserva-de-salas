import { z } from "zod"; //Importamos z, objeto usado para criar schemas de validação.

export const createRoomSchema = z.object({ //Estamos declarando que os dados para criar uma sala precisam ser um objeto.
  name: z
    .string() //precisa ser texto.
    .trim() //remove espaços do início e do final.
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  capacity: z
    .number()
    .int("A capacidade deve ser um número inteiro.")
    .positive("A capacidade deve ser maior que zero."),
});

export const updateRoomSchema = createRoomSchema.partial().refine(
  (data) => data.name !== undefined || data.capacity !== undefined,
  {
    message: "Informe ao menos um campo para atualizar.",
  },
);

export const roomIdSchema = z
  .string()
  .uuid("O identificador da sala é inválido.");

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
