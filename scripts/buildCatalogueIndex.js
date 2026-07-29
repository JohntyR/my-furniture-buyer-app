// One-off build step for the catalogue RAG demo: parses the product PDF into
// per-product chunks, embeds each one locally, and writes the result to
// data/catalogue-index.json. Re-run this whenever Full-Product-Catalogue.pdf
// changes. Runtime code (src/lib/catalogueRag.js) reads this file and embeds
// the user's question with the same model, so the two vector spaces line up.
const fs = require("fs");
const path = require("path");
const { parseCatalogueChunks } = require("./lib/parseCatalogueChunks");
const { embedText } = require("../src/lib/embeddings");

const PDF_PATH = path.join(__dirname, "..", "Full-Product-Catalogue.pdf");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "catalogue-index.json");

async function main() {
  console.log("Parsing PDF into per-product chunks...");
  const chunks = await parseCatalogueChunks(PDF_PATH);
  console.log(`Parsed ${chunks.length} chunks.`);
  console.log("Embedding each chunk locally (first run downloads the model, ~90MB)...");

  const indexed = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await embedText(chunk.text);
    indexed.push({ ...chunk, embedding });
    if ((i + 1) % 100 === 0 || i === chunks.length - 1) {
      console.log(`  embedded ${i + 1}/${chunks.length}`);
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(indexed));
  console.log(`Wrote ${indexed.length} embedded chunks to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
