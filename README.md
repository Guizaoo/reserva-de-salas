# Reserva de Salas

Aplicação full-stack para cadastrar salas e gerenciar reservas de horários,
com validações de capacidade e conflito executadas no servidor.

## Demonstração

- Repositório: [github.com/Guizaoo/reserva-de-salas](https://github.com/Guizaoo/reserva-de-salas)
- Frontend: [reserva-de-salas-eta.vercel.app](https://reserva-de-salas-eta.vercel.app/)
- Salas: [reserva-de-salas-eta.vercel.app/rooms](https://reserva-de-salas-eta.vercel.app/rooms)
- Reservas: [reserva-de-salas-eta.vercel.app/reservations](https://reserva-de-salas-eta.vercel.app/reservations)
- API - salas: [reserva-de-salas-eta.vercel.app/api/rooms](https://reserva-de-salas-eta.vercel.app/api/rooms)
- API - reservas: [reserva-de-salas-eta.vercel.app/api/reservations](https://reserva-de-salas-eta.vercel.app/api/reservations)
- Swagger: [reserva-de-salas-eta.vercel.app/docs](https://reserva-de-salas-eta.vercel.app/docs)

O frontend e a API são publicados juntos na Vercel. O banco PostgreSQL está
hospedado no Supabase.

## Funcionalidades

- CRUD completo de salas, com nome e capacidade;
- CRUD completo de reservas;
- listagem de reservas ordenada pelo horário de início;
- filtro de reservas por sala;
- estados derivados: próxima, em andamento e encerrada;
- validação de campos obrigatórios, UUIDs, números e datas;
- bloqueio de reservas acima da capacidade da sala;
- bloqueio de reservas sobrepostas na mesma sala;
- proteção contra exclusão de uma sala que possui reservas;
- estados visuais de carregamento, erro e lista vazia;
- interface responsiva.

## Tecnologias

- Next.js 16 com App Router;
- React 19;
- TypeScript;
- Tailwind CSS 4;
- Zod para validação;
- Drizzle ORM e Drizzle Kit;
- PostgreSQL no Supabase;
- Vercel para deploy do frontend e da API.

## Arquitetura

```text
Navegador
   |
   | fetch (/api/*)
   v
Route Handlers do Next.js
   |
   | validação com Zod
   v
Camada de dados e regras de negócio
   |
   | Drizzle ORM
   v
PostgreSQL / Supabase
```

O navegador nunca acessa o banco diretamente. A variável `DATABASE_URL` fica
disponível somente no servidor. As regras de capacidade e conflito são
executadas na API, mesmo que a requisição não tenha vindo da interface.

### Estrutura principal

```text
app/
  api/
    openapi/
    rooms/
    reservations/
  docs/
  rooms/
  reservations/
  ui/
    app-header.tsx
    reservation-dashboard.tsx
    reservation-form.tsx
    reservation-delete-dialog.tsx
    room-form.tsx
    room-delete-dialog.tsx
  page.tsx
lib/
  data/
    rooms.ts
    reservations.ts
  db/
    errors.ts
    index.ts
    schema.ts
  validations/
    room.ts
    reservation.ts
drizzle/
  0000_dear_marvex.sql
  0001_prevent-overlapping-reservations.sql
```

As páginas visuais são separadas por responsabilidade:

- `/`: visão geral e indicadores;
- `/rooms`: CRUD de salas;
- `/reservations`: CRUD de reservas;
- `/docs`: documentação Swagger da API.

## Banco de dados

### `rooms`

| Campo | Descrição |
| --- | --- |
| `id` | UUID gerado pelo banco |
| `name` | Nome único, sem diferenciar maiúsculas e minúsculas |
| `capacity` | Capacidade inteira e maior que zero |
| `created_at` | Data de criação |
| `updated_at` | Data da última atualização |

### `reservations`

| Campo | Descrição |
| --- | --- |
| `id` | UUID gerado pelo banco |
| `title` | Título da reserva |
| `room_id` | Referência para a sala |
| `participant_count` | Quantidade inteira e maior que zero |
| `starts_at` | Início com fuso horário |
| `ends_at` | Término com fuso horário |
| `created_at` | Data de criação |
| `updated_at` | Data da última atualização |

O relacionamento usa `ON DELETE RESTRICT`: uma sala com reservas não pode ser
excluída. As datas são armazenadas como `timestamptz`, e o frontend converte o
horário local para ISO 8601 antes de enviar.

## Regras e decisões

### Conflito de horário

Duas reservas entram em conflito quando pertencem à mesma sala e seus
intervalos se sobrepõem:

```text
reservaExistente.inicio < novaReserva.fim
e
reservaExistente.fim > novaReserva.inicio
```

A checagem ocorre dentro de uma transação serializável na camada de dados.
Além disso, o PostgreSQL possui a constraint
`reservations_no_time_overlap`, criada com `EXCLUDE USING gist`. Essa segunda
proteção evita conflito mesmo se requisições concorrentes chegarem quase ao
mesmo tempo.

### Reservas adjacentes

Uma reserva que termina exatamente quando outra começa é permitida:

```text
Reserva A: 14:00 - 15:00
Reserva B: 15:00 - 16:00
```

Os períodos são tratados como intervalos `[início, fim)`: o início pertence ao
intervalo e o término não. Essa decisão permite utilizar a sala de forma
contínua sem criar uma sobreposição.

### Capacidade

A quantidade de participantes deve ser positiva e não pode ultrapassar a
capacidade da sala. A abordagem escolhida foi bloquear a operação e responder
com `422 Unprocessable Entity`, informando a capacidade máxima.

### Horário de funcionamento

Não foi imposto um horário fixo de funcionamento. Qualquer período é aceito
desde que o término seja posterior ao início e não exista conflito. Em uma
evolução do produto, essa regra poderia ser configurável por sala ou unidade.

### Status da reserva

O status não é salvo no banco, pois ele muda com o tempo. Ele é calculado
durante a listagem:

- `upcoming`: o início ainda não chegou;
- `ongoing`: o horário atual está entre início e término;
- `finished`: o término já passou.

## API

### Salas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/rooms` | Lista salas por nome |
| `POST` | `/api/rooms` | Cria uma sala |
| `PATCH` | `/api/rooms/:id` | Atualiza parcialmente uma sala |
| `DELETE` | `/api/rooms/:id` | Exclui uma sala sem reservas |

Exemplo de criação:

```json
{
  "name": "Sala Horizonte",
  "capacity": 10
}
```

### Reservas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/reservations` | Lista reservas por início |
| `GET` | `/api/reservations?roomId=:id` | Filtra reservas por sala |
| `POST` | `/api/reservations` | Cria uma reserva |
| `PATCH` | `/api/reservations/:id` | Atualiza parcialmente uma reserva |
| `DELETE` | `/api/reservations/:id` | Exclui uma reserva |

Exemplo de criação:

```json
{
  "title": "Reunião comercial",
  "roomId": "3dcd3c04-1f11-4f03-863a-3c908d7e2e64",
  "participantCount": 5,
  "startsAt": "2026-08-01T13:00:00.000Z",
  "endsAt": "2026-08-01T14:00:00.000Z"
}
```

Principais respostas:

| Status | Significado |
| --- | --- |
| `200` | Consulta ou atualização concluída |
| `201` | Registro criado |
| `204` | Registro excluído, sem corpo na resposta |
| `400` | JSON ou identificador inválido |
| `404` | Sala ou reserva não encontrada |
| `409` | Nome duplicado, conflito de horário ou sala em uso |
| `422` | Campos inválidos ou capacidade excedida |
| `500` | Erro interno inesperado |

## Executando localmente

### Pré-requisitos

- Node.js 20.9 ou superior;
- npm;
- projeto PostgreSQL no Supabase.

### 1. Clone e instale

```bash
git clone https://github.com/Guizaoo/reserva-de-salas.git
cd reserva-de-salas
npm install
```

### 2. Configure o ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

No PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Preencha a variável com uma connection string do Supabase:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/postgres?sslmode=require
```

Para desenvolvimento e migrations, pode ser usado o Session pooler. Para o
deploy serverless na Vercel, foi usado o Transaction pooler, normalmente na
porta `6543`. Se a senha possuir caracteres reservados de URL, eles precisam
ser percent-encoded.

Nunca envie `.env.local` ao Git. O repositório contém apenas `.env.example`
com um valor ilustrativo.

### 3. Aplique as migrations

```bash
npm run db:migrate
```

Esse comando cria as tabelas, índices, checks e a constraint de sobreposição.

### 4. Inicie o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Scripts

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera e valida o build de produção |
| `npm run start` | Executa o build de produção |
| `npm run lint` | Analisa o código com ESLint |
| `npm run db:generate` | Gera migrations a partir do schema |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:studio` | Abre a interface do Drizzle Studio |

## Validações realizadas

Durante o desenvolvimento, foram verificados manualmente:

- criação, listagem, edição e exclusão de salas;
- rejeição de nome de sala duplicado;
- proteção contra exclusão de sala com reservas;
- criação, filtro, edição e exclusão de reservas;
- rejeição de participante acima da capacidade;
- rejeição de término anterior ou igual ao início;
- bloqueio de horários sobrepostos;
- aceitação de reservas adjacentes;
- persistência após atualizar a página;
- respostas HTTP `200`, `201`, `204`, `400`, `409` e `422`;
- funcionamento do frontend e da API no deploy de produção;
- `npm run lint` e `npm run build` sem erros.

## Reservas recorrentes

Para suportar uma regra como "toda terça-feira às 14h pelos próximos três
meses", eu separaria a definição da recorrência das ocorrências:

- uma tabela `recurrence_rules` guardaria frequência, intervalo, dias da
  semana, data final e fuso horário;
- cada horário concreto continuaria sendo uma linha em `reservations`, ligada
  à regra por `recurrence_rule_id`;
- cancelamentos ou mudanças de uma única ocorrência seriam tratados como
  exceções, sem alterar toda a série.

Ao criar ou editar a série, o servidor geraria as ocorrências do período e
verificaria capacidade e conflito para cada uma. A operação poderia ser
atômica, rejeitando toda a série e informando quais datas conflitaram, ou
permitir que o usuário confirme apenas as ocorrências livres. Manter as
ocorrências materializadas preservaria a constraint atual de sobreposição,
facilitaria consultas por intervalo e permitiria tratar horário de verão com
um fuso explícito na regra.
