import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  const shouldUseAccelerate = Boolean(process.env.DATABASE_URL?.startsWith("prisma+"));

  if (shouldUseAccelerate) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return client;
}

type PrismaClientSingleton = PrismaClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prismaGlobal?: PrismaClientSingleton;
};

export const prisma: PrismaClient = globalForPrisma.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = prisma;
}
