import type { Metadata } from "next";

import SwaggerDocumentation from "@/app/docs/swagger-documentation";

export const metadata: Metadata = {
  title: "API  | Reserva de Salas",
  description: "Documentação interativa da API de salas e reservas.",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
       
        <SwaggerDocumentation />
      </div>
    </main>
  );
}
