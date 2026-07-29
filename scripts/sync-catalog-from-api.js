// Refreshes name/category/price on the local Product table using the real
// furniture shop catalogue API (the search-index endpoint, per the Day 1
// Participant Guide - it's the fast, no-images endpoint meant for browsing).
//
// Product photos already live locally in public/product-images/<item_id>.jpg
// (downloaded once from the shared catalog database) and are matched up by
// item_id here rather than re-downloaded.
//
// Usage: npm run sync-catalog
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const BASE_URL = process.env.PRODUCT_API_BASE_URL;
if (!BASE_URL) {
  throw new Error("PRODUCT_API_BASE_URL is not set. Add it to your .env file.");
}

const prisma = new PrismaClient();

async function main() {
  const response = await fetch(`${BASE_URL}/catalogue/search-index`);
  if (!response.ok) {
    throw new Error(`search-index request failed: ${response.status} ${response.statusText}`);
  }
  const items = await response.json();
  console.log(`Fetched ${items.length} products from the catalogue API.`);

  let updated = 0;
  let created = 0;

  for (const item of items) {
    const imageUrl = `/product-images/${item.item_id}.jpg`;
    const data = {
      itemId: item.item_id,
      name: item.product_name,
      category: item.category,
      price: item.price,
    };

    const result = await prisma.product.updateMany({
      where: { imageUrl },
      data,
    });

    if (result.count > 0) {
      updated += result.count;
    } else {
      await prisma.product.create({
        data: {
          ...data,
          description: item.category,
          imageUrl,
        },
      });
      created += 1;
    }
  }

  console.log(`Updated ${updated} existing products, created ${created} new ones.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
