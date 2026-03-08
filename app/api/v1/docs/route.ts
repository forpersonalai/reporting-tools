import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Reporting Tools API",
    version: "1.0.0",
    description: "Public REST API untuk sistem Reporting Tools",
  },
  servers: [
    { url: "http://localhost:3000/api/v1", description: "Development" },
  ],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API_KEY",
      },
    },
  },
  paths: {
    "/reports": {
      get: {
        summary: "Ambil daftar laporan",
        tags: ["Reports"],
      },
      post: {
        summary: "Buat laporan baru",
        tags: ["Reports"],
      },
    },
    "/reports/{id}": {
      get: { summary: "Ambil detail laporan", tags: ["Reports"] },
      put: { summary: "Update laporan", tags: ["Reports"] },
      patch: { summary: "Partial update laporan", tags: ["Reports"] },
      delete: { summary: "Archive laporan", tags: ["Reports"] },
    },
    "/reports/{id}/print": {
      post: { summary: "Buat print log baru", tags: ["Print Logs"] },
    },
    "/print-logs": {
      get: { summary: "Ambil semua print logs", tags: ["Print Logs"] },
    },
    "/dashboard/stats": {
      get: { summary: "Ambil statistik agregat dashboard", tags: ["Dashboard"] },
    },
    "/users": {
      get: { summary: "Ambil daftar users", tags: ["Users"] },
    },
    "/webhooks": {
      post: { summary: "Daftarkan webhook", tags: ["Webhooks"] },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
