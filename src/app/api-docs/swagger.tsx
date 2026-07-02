"use client";

import Script from "next/script";

/** Client-only Swagger UI mount that boots once the CDN bundle loads. */
export function SwaggerViewer() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"
      />
      <div id="swagger-ui" className="px-2 pb-16" />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onReady={() => {
          const w = window as unknown as {
            SwaggerUIBundle?: (opts: Record<string, unknown>) => void;
          };
          w.SwaggerUIBundle?.({
            url: "/api/openapi.json",
            dom_id: "#swagger-ui",
            deepLinking: true,
            docExpansion: "none",
            defaultModelsExpandDepth: -1,
          });
        }}
      />
    </>
  );
}
