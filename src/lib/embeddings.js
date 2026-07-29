// Local text-embedding model (all-MiniLM-L6-v2, via @huggingface/transformers)
// - runs fully in this process, no API key, no external account, no cost.
// Used both to build the catalogue index (scripts/buildCatalogueIndex.js) and
// to embed a live user question (src/lib/catalogueRag.js) - the two MUST use
// this same function, since embeddings from different models aren't
// comparable to each other.
let extractorPromise = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
    );
  }
  return extractorPromise;
}

// Returns a normalized (unit-length) embedding vector as a plain array, so
// cosine similarity between two embeddings is just their dot product.
async function embedText(text) {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

module.exports = { embedText };
