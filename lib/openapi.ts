export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "API Reserva de Salas",
    version: "1.0.0",
    description:
      "API REST para cadastrar salas e administrar reservas, com validações de capacidade e conflito de horários.",
  },
  servers: [
    {
      url: "/",
      description: "Ambiente atual",
    },
  ],
  tags: [
    {
      name: "Salas",
      description: "Cadastro e manutenção dos espaços disponíveis.",
    },
    {
      name: "Reservas",
      description: "Agenda e manutenção das reservas de horários.",
    },
  ],

  paths: {
    "/api/rooms": {
      get: {
        tags: ["Salas"],
        summary: "Listar salas",
        description: "Retorna todas as salas ordenadas pelo nome.",
        responses: {
          "200": {
            description: "Lista carregada com sucesso.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Room" },
                    },
                  },
                },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },

      post: {
        tags: ["Salas"],
        summary: "Criar sala",
        description: "Cadastra uma sala com nome único e capacidade positiva.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRoomInput" },
              example: {
                name: "Sala Horizonte",
                capacity: 10,
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Sala criada com sucesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RoomResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": {
            description: "Já existe uma sala com esse nome.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "422": { $ref: "#/components/responses/ValidationError" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/api/rooms/{id}": {
      parameters: [{ $ref: "#/components/parameters/ResourceId" }],
      patch: {
        tags: ["Salas"],
        summary: "Editar sala",
        description:
          "Atualiza o nome, a capacidade ou os dois campos de uma sala.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateRoomInput" },
              example: {
                capacity: 12,
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Sala atualizada com sucesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RoomResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": {
            description: "Já existe outra sala com o nome informado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "422": { $ref: "#/components/responses/ValidationError" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      
      delete: {
        tags: ["Salas"],
        summary: "Excluir sala",
        description:
          "Exclui uma sala somente quando ela não possui reservas relacionadas.",
        responses: {
          "204": {
            description: "Sala excluída com sucesso. A resposta não possui corpo.",
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": {
            description: "A sala possui reservas e não pode ser excluída.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/api/reservations": {
      get: {
        tags: ["Reservas"],
        summary: "Listar reservas",
        description:
          "Retorna as reservas ordenadas pelo início e permite filtrar por sala.",
        parameters: [
          {
            name: "roomId",
            in: "query",
            required: false,
            description: "UUID da sala usada como filtro.",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Lista carregada com sucesso.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ReservationWithStatus",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      post: {
        tags: ["Reservas"],
        summary: "Criar reserva",
        description:
          "Cria uma reserva após validar sala, capacidade e conflito de horário.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateReservationInput",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Reserva criada com sucesso.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReservationResponse",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": {
            description: "A sala já possui uma reserva nesse intervalo.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "422": { $ref: "#/components/responses/ValidationError" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/api/reservations/{id}": {
      parameters: [{ $ref: "#/components/parameters/ResourceId" }],
      patch: {
        tags: ["Reservas"],
        summary: "Editar reserva",
        description:
          "Atualiza parcialmente uma reserva e executa novamente as regras de negócio.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateReservationInput",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Reserva atualizada com sucesso.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReservationResponse",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": {
            description: "A alteração causaria conflito de horário.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "422": { $ref: "#/components/responses/ValidationError" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      delete: {
        tags: ["Reservas"],
        summary: "Excluir reserva",
        description: "Remove uma reserva pelo UUID.",
        responses: {
          "204": {
            description:
              "Reserva excluída com sucesso. A resposta não possui corpo.",
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
  },
  components: {
    parameters: {
      ResourceId: {
        name: "id",
        in: "path",
        required: true,
        description: "UUID do registro.",
        schema: {
          type: "string",
          format: "uuid",
        },
      },
    },
    schemas: {
      Room: {
        type: "object",
        required: ["id", "name", "capacity", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Sala Horizonte" },
          capacity: { type: "integer", minimum: 1, example: 10 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateRoomInput: {
        type: "object",
        required: ["name", "capacity"],
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            example: "Sala Horizonte",
          },
          capacity: {
            type: "integer",
            minimum: 1,
            example: 10,
          },
        },
      },
      UpdateRoomInput: {
        type: "object",
        minProperties: 1,
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
          },
          capacity: {
            type: "integer",
            minimum: 1,
          },
        },
      },
      Reservation: {
        type: "object",
        required: [
          "id",
          "title",
          "roomId",
          "participantCount",
          "startsAt",
          "endsAt",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Reunião comercial" },
          roomId: { type: "string", format: "uuid" },
          participantCount: { type: "integer", minimum: 1, example: 5 },
          startsAt: {
            type: "string",
            format: "date-time",
            example: "2026-08-01T13:00:00.000Z",
          },
          endsAt: {
            type: "string",
            format: "date-time",
            example: "2026-08-01T14:00:00.000Z",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ReservationWithStatus: {
        allOf: [
          { $ref: "#/components/schemas/Reservation" },
          {
            type: "object",
            required: ["roomName", "status"],
            properties: {
              roomName: { type: "string", example: "Sala Horizonte" },
              status: {
                type: "string",
                enum: ["upcoming", "ongoing", "finished"],
              },
            },
          },
        ],
      },
      CreateReservationInput: {
        type: "object",
        required: [
          "title",
          "roomId",
          "participantCount",
          "startsAt",
          "endsAt",
        ],
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 120,
            example: "Reunião comercial",
          },
          roomId: { type: "string", format: "uuid" },
          participantCount: {
            type: "integer",
            minimum: 1,
            example: 5,
          },
          startsAt: {
            type: "string",
            format: "date-time",
            example: "2026-08-01T13:00:00.000Z",
          },
          endsAt: {
            type: "string",
            format: "date-time",
            example: "2026-08-01T14:00:00.000Z",
          },
        },
      },
      UpdateReservationInput: {
        type: "object",
        minProperties: 1,
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 120,
          },
          roomId: { type: "string", format: "uuid" },
          participantCount: { type: "integer", minimum: 1 },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
        },
      },
      RoomResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Room" },
        },
      },
      ReservationResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Reservation" },
        },
      },
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "string",
            example: "Não foi possível concluir a operação.",
          },
          fields: {
            type: "object",
            additionalProperties: { type: "string" },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "JSON ou identificador inválido.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Registro não encontrado.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      ValidationError: {
        description: "Dados inválidos ou capacidade excedida.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      InternalError: {
        description: "Erro interno inesperado.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
} as const;
