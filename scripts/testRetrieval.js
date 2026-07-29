// Standalone retrieval check - no LLM involved. Run this to see, by eye,
// whether semantic search over the catalogue index is finding sensible
// products for a free-text question, before wiring retrieval up to the agent.
//
// Usage: npm run test-retrieval -- "something cheap for a kid's room"
const fs = require("fs");
const path = require("path");
const { embedText } = require("../src/lib/embeddings");

const INDEX_PATH = path.join(__dirname, "..", "data", "catalogue-index.json");

// Embeddings from src/lib/embeddings.js are already unit-length, so their
// dot product is the cosine similarity - no separate magnitude division needed.
function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

async function searchCatalogue(query, topK = 8) {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  const queryEmbedding = await embedText(query);

  return index
    .map((chunk) => ({ ...chunk, score: dotProduct(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

async function main() {
  const query = process.argv.slice(2).join(" ");
  if (!query) {
    console.error('Usage: npm run test-retrieval -- "your question"');
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(INDEX_PATH)) {
    console.error("data/catalogue-index.json doesn't exist yet - run `npm run build-catalogue-index` first.");
    process.exitCode = 1;
    return;
  }

  const results = await searchCatalogue(query);
  console.log(`Top matches for: "${query}"\n`);
  for (const r of results) {
    console.log(`${r.score.toFixed(3)}  ${r.name}  —  ${r.category}, $${r.price.toFixed(2)}  [${r.itemId}]`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
