// Runtime semantic ("vibe") search over the catalogue PDF's pre-embedded
// chunks (see scripts/buildCatalogueIndex.js). This is a RAG demo, kept
// deliberately separate from productApi.js: it answers free-text questions
// like "something cosy for a reading nook" that don't map onto the live
// API's exact category filter, using a point-in-time snapshot of the
// catalogue rather than a live lookup.
import { readFile } from "fs/promises";
import path from "path";
import { embedText } from "./embeddings";

const INDEX_PATH = path.join(process.cwd(), "data", "catalogue-index.json");

// Loaded once per server process and reused - the index only changes when
// someone re-runs `npm run build-catalogue-index`, which isn't a runtime event.
let indexPromise = null;

function loadIndex() {
  if (!indexPromise) {
    indexPromise = readFile(INDEX_PATH, "utf8").then((raw) => JSON.parse(raw));
  }
  return indexPromise;
}

// Both vectors are unit-length (see embedText), so their dot product is the
// cosine similarity - no separate magnitude division needed.
function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// Returns the topK catalogue chunks whose meaning is closest to `query`.
export async function searchCatalogueByDescription(query, topK = 6) {
  const [index, queryEmbedding] = await Promise.all([loadIndex(), embedText(query)]);

  return index
    .map((chunk) => ({
      itemId: chunk.itemId,
      name: chunk.name,
      category: chunk.category,
      price: chunk.price,
      dimensions: chunk.dimensions,
      score: dotProduct(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
