import { PrismaClient } from "@prisma/client";

// Re-export all generated types from Prisma Client
export * from "@prisma/client";

// Singleton pattern — prevents multiple PrismaClient instances in development
// (Next.js hot-reload creates new modules but globalThis persists)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
