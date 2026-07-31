"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
});

export default function SwaggerDocumentation() {
  return (
    <div className="swagger-documentation rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm sm:p-5">
      <SwaggerUI
        url="/api/openapi"
        docExpansion="none"
        defaultModelExpandDepth={1}
        defaultModelsExpandDepth={-1}
      />
    </div>
  );
}
