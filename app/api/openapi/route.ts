import { openApiDocument } from "@/lib/openapi";

// Disponibiliza a especificação em JSON para o Swagger e outras ferramentas.
export function GET() {
  return Response.json(openApiDocument);
}
