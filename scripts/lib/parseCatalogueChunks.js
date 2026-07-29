// Parses Full-Product-Catalogue.pdf into one chunk per product.
//
// The PDF is a static export of the same 762-item catalogue the live shop API
// serves (see src/lib/productApi.js) - every product is a fixed-shape record:
//   [name line(s)]
//   category
//   $price
//   [width × height × depth cm]   <- optional, sometimes missing
//   item_id (8 digits)
// pdf-parse also inserts "-- N of 64 --" page-break markers and a title/
// preamble block before the first product, both stripped below.
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const PAGE_BREAK_RE = /^-- \d+ of \d+ --$/;
// Item IDs are plain digit strings but aren't all zero-padded to 8 digits
// (e.g. "9158152" is 7) - any all-digit line is unambiguous here, since every
// other line in a record (name, category, price, dimensions) contains a
// non-digit character.
const ITEM_ID_RE = /^\d{5,10}$/;
const PRICE_RE = /^\$[\d,]+\.\d{2}$/;
const DIMENSIONS_RE = /^[\d.]+\s*×\s*(?:[\d.]+|\?)\s*×\s*(?:[\d.]+|\?)\s*cm$/;

function stripPreamble(lines) {
  const startIndex = lines.findIndex((line) => line === "PRODUCTS");
  if (startIndex === -1) {
    throw new Error('Could not find the "PRODUCTS" marker that starts the catalogue listing.');
  }
  return lines.slice(startIndex + 1);
}

// Turns the flat, reversed-parse-friendly line stream into one record per
// product. Parsing backward from the item_id (the one unambiguous anchor)
// is what makes the optional dimensions line and multi-line names tractable.
function parseRecords(lines) {
  const records = [];
  let buffer = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || PAGE_BREAK_RE.test(line)) continue;

    if (ITEM_ID_RE.test(line)) {
      const fields = [...buffer];
      buffer = [];

      let dimensions = null;
      if (fields.length && DIMENSIONS_RE.test(fields[fields.length - 1])) {
        dimensions = fields.pop();
      }

      const priceLine = fields.pop();
      if (!priceLine || !PRICE_RE.test(priceLine)) {
        throw new Error(`Expected a price line before item_id ${line}, got: ${JSON.stringify(priceLine)}`);
      }
      const price = Number(priceLine.slice(1).replace(/,/g, ""));

      const category = fields.pop();
      if (!category) {
        throw new Error(`Expected a category line before item_id ${line}.`);
      }

      const name = fields.join(" ").trim();
      if (!name) {
        throw new Error(`Expected a product name before item_id ${line}.`);
      }

      records.push({ itemId: line, name, category, price, dimensions });
    } else {
      buffer.push(line);
    }
  }

  if (buffer.length) {
    throw new Error(`Leftover unparsed lines at end of document: ${JSON.stringify(buffer)}`);
  }

  return records;
}

// One natural-language sentence per product - this is what gets embedded.
// Deliberately plain (no marketing copy in the source PDF to draw on): name,
// category, price, and dimensions are the only signal available for semantic
// ("vibe") matching.
function toChunkText(record) {
  const dimensionsText = record.dimensions ? `, dimensions ${record.dimensions}` : "";
  return `${record.name} — category: ${record.category}, price: $${record.price.toFixed(2)}${dimensionsText}.`;
}

async function parseCatalogueChunks(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const lines = stripPreamble(result.text.split("\n"));
  const records = parseRecords(lines);

  return records.map((record) => ({
    ...record,
    text: toChunkText(record),
  }));
}

module.exports = { parseCatalogueChunks };

// Allow running directly for a quick sanity check:
//   node scripts/lib/parseCatalogueChunks.js
if (require.main === module) {
  const pdfPath = path.join(__dirname, "..", "..", "Full-Product-Catalogue.pdf");
  parseCatalogueChunks(pdfPath)
    .then((chunks) => {
      console.log(`Parsed ${chunks.length} product chunks.`);
      console.log(chunks.slice(0, 3));
      console.log(chunks.slice(-3));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
