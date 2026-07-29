import "./envConfig"; //carregamento do .env.local
import { defineConfig } from "drizzle-kit"; // configuração do Drizzle.

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL não foi definida. Crie um arquivo .env.local com a conexão do Supabase.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts", // descrição das tabelas.
  out: "./drizzle", //onde as migrations serão geradas.
  dialect: "postgresql", //informa que usamos PostgreSQL.
  dbCredentials: { //conexão do banco.
    url: databaseUrl,
  },
  strict: true, //pede confirmação antes de operações potencialmente perigosas.
  verbose: true, //mostra com mais clareza o que a ferramenta pretende executar.
});
