import { PrismaClient } from "@prisma/client";

// Next.js reloads modules often in development, which would otherwise create
// a new database connection on every file change. Stashing the client on
// `globalThis` keeps a single connection alive across those reloads.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
