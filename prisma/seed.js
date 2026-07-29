// Bootstraps a demo login account. The product catalogue itself is loaded
// separately by scripts/import-catalog.js.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "password123";
const DEMO_BUDGET = 2000;

async function main() {
  const existingUser = await prisma.user.findUnique({
    where: { username: DEMO_USERNAME },
  });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await prisma.user.create({
      data: { username: DEMO_USERNAME, passwordHash, budget: DEMO_BUDGET },
    });
    console.log(
      `Created demo user (username: "${DEMO_USERNAME}", password: "${DEMO_PASSWORD}", budget: $${DEMO_BUDGET}).`
    );
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
