// One-off import: replaces the Product table with real catalogue data
// pulled from an external MongoDB "catalog" collection.
//
// Usage: npm run import-catalog
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const { PrismaClient } = require("@prisma/client");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. Add it to your .env file.");
}

const IMAGE_DIR = path.join(__dirname, "..", "public", "product-images");

const prisma = new PrismaClient();
const mongoClient = new MongoClient(MONGODB_URI);

function buildDescription(doc) {
  const dimensions = [doc.width, doc.depth, doc.height].filter(
    (value) => typeof value === "number"
  );
  const dimensionsText = dimensions.length ? `${dimensions.join(" × ")} cm` : null;
  const colourText = doc.colours?.length ? doc.colours.join(", ") : null;

  return [doc.category, colourText, dimensionsText].filter(Boolean).join(" — ");
}

function extensionForMimeType(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg"; // covers image/jpeg, the only type this dataset uses today
}

async function main() {
  await mongoClient.connect();
  const docs = await mongoClient.db().collection("catalog").find().toArray();
  console.log(`Fetched ${docs.length} documents from the catalog collection.`);

  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const products = [];
  for (const doc of docs) {
    const extension = extensionForMimeType(doc.image_mime_type);
    const fileName = `${doc.item_id}.${extension}`;
    fs.writeFileSync(path.join(IMAGE_DIR, fileName), Buffer.from(doc.image_url, "base64"));

    products.push({
      name: doc.product_name,
      description: buildDescription(doc),
      price: doc.price,
      imageUrl: `/product-images/${fileName}`,
    });
  }
  console.log(`Wrote ${products.length} product images to public/product-images/.`);

  await prisma.$transaction([
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
    prisma.product.createMany({ data: products }),
  ]);
  console.log(`Replaced the product catalogue with ${products.length} real products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoClient.close();
    await prisma.$disconnect();
  });
