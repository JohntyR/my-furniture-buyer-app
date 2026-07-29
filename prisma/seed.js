// Bootstraps a demo login account. The catalogue, balance, and order history
// all come live from the furniture shop API (see src/lib/productApi.js) -
// this is the only local data the app needs.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "password123";

async function main() {
  const existingUser = await prisma.user.findUnique({
    where: { username: DEMO_USERNAME },
  });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await prisma.user.create({
      data: { username: DEMO_USERNAME, passwordHash },
    });
    console.log(`Created demo user (username: "${DEMO_USERNAME}", password: "${DEMO_PASSWORD}").`);
  } else {
    console.log("Demo user already exists, skipping.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
