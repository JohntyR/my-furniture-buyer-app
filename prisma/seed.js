// Placeholder catalogue data for local development.
// Replace this with a real product catalogue in a later step.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const PLACEHOLDER_PRODUCTS = [
  {
    name: "Oakwood Dining Table",
    description: "Solid oak dining table, seats six.",
    price: 899.99,
    imageUrl: "https://placehold.co/400x300?text=Oakwood+Dining+Table",
  },
  {
    name: "Velvet Accent Chair",
    description: "Compact accent chair in emerald velvet.",
    price: 349.5,
    imageUrl: "https://placehold.co/400x300?text=Velvet+Accent+Chair",
  },
  {
    name: "Scandinavian Bookshelf",
    description: "Five-shelf bookcase in light ash veneer.",
    price: 259.0,
    imageUrl: "https://placehold.co/400x300?text=Scandinavian+Bookshelf",
  },
  {
    name: "Linen Sofa (3-Seater)",
    description: "Three-seater sofa upholstered in natural linen.",
    price: 1249.0,
    imageUrl: "https://placehold.co/400x300?text=Linen+Sofa",
  },
  {
    name: "Marble-Top Coffee Table",
    description: "Coffee table with a genuine marble top and brass legs.",
    price: 429.0,
    imageUrl: "https://placehold.co/400x300?text=Marble+Coffee+Table",
  },
  {
    name: "Walnut Bed Frame (Queen)",
    description: "Queen-size bed frame in solid walnut.",
    price: 749.0,
    imageUrl: "https://placehold.co/400x300?text=Walnut+Bed+Frame",
  },
];

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "password123";
const DEMO_BUDGET = 2000;

async function main() {
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({ data: PLACEHOLDER_PRODUCTS });
    console.log(`Seeded ${PLACEHOLDER_PRODUCTS.length} placeholder products.`);
  } else {
    console.log("Products already exist, skipping product seed.");
  }

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
