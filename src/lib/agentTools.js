// The four furniture shop API actions, wired up as tools for the shopping
// assistant agent (src/app/api/agent/route.js). Names/descriptions match the
// design worked out before building this: each description is explicit about
// what the underlying API can and can't do, since the model can only be as
// honest as the text we give it.
import { searchCatalogue, toDisplayProduct, getProductDetail, getBalance, placeRealOrder } from "@/lib/productApi";

export const AGENT_TOOLS = [
  {
    name: "search_catalogue",
    description:
      "Look up furniture items by exact category name, with pagination. Returns name, price, category, and dimensions for every match. " +
      "This only does an exact, case-insensitive category match - there is no keyword search, price filter, or colour filter. " +
      "If the user wants something cheap, a specific colour, or a vague vibe ('modern', 'for a kid's room'), fetch the relevant " +
      "category/categories and apply that judgement yourself over the returned results - do not expect the API to understand it.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Optional. One of the shop's exact category names, e.g. 'Chairs', 'Sofas & armchairs', 'Bar furniture'. " +
            "Omit to list every category's items (use categories_only first if you don't already know the exact name).",
        },
        categories_only: {
          type: "boolean",
          description:
            "Set true to just list the valid category names instead of products - use this when you don't know the exact category string to filter by.",
        },
      },
    },
  },
  {
    name: "get_product_details",
    description:
      "Get full details, including exact dimensions, for one specific item_id you already know (e.g. from a prior search_catalogue result). " +
      "Not for browsing or search - it only works for a single already-known item.",
    input_schema: {
      type: "object",
      properties: {
        item_id: { type: "string", description: "The item's item_id, from a prior search_catalogue result." },
      },
      required: ["item_id"],
    },
  },
  {
    name: "check_balance",
    description:
      "Check the current user's real remaining balance in the live event system. There is no user selection - it always reports on the " +
      "one identity this app is authorized as. This is a real balance for the event, not a sandbox number.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "place_order",
    description:
      "Place a real order for a given item_id and quantity. This immediately and irreversibly debits the user's real balance - it is a " +
      "genuine transaction, not a quote or a dry run. Always confirm with the user before calling this. Compute the expected cost yourself " +
      "(price x quantity from a prior search/lookup) and compare it to check_balance before calling, but still be ready to handle a " +
      "402 (insufficient balance) or 404 (item no longer available) response gracefully - the catalogue and balance can change between calls.",
    input_schema: {
      type: "object",
      properties: {
        item_id: { type: "string", description: "The item's item_id to purchase." },
        quantity: { type: "integer", description: "How many to buy. Defaults to 1.", minimum: 1 },
      },
      required: ["item_id"],
    },
  },
];

async function getCategories() {
  const items = await searchCatalogue();
  return [...new Set(items.map((item) => item.category))].sort();
}

// Executes one tool call and returns a JSON-serializable result (never
// throws - failures come back as a plain object the model can reason about).
export async function runAgentTool(name, input) {
  try {
    switch (name) {
      case "search_catalogue": {
        if (input?.categories_only) {
          return { categories: await getCategories() };
        }
        const items = await searchCatalogue();
        const filtered = input?.category
          ? items.filter((item) => item.category.toLowerCase() === input.category.toLowerCase())
          : items;
        return {
          count: filtered.length,
          products: filtered.map((item) => {
            const display = toDisplayProduct(item);
            return {
              item_id: display.itemId,
              name: display.name,
              category: display.category,
              price: display.price,
              description: display.description,
            };
          }),
        };
      }
      case "get_product_details": {
        const detail = await getProductDetail(input.item_id);
        if (!detail) {
          return { error: `No product with item_id '${input.item_id}'.` };
        }
        return detail;
      }
      case "check_balance": {
        return await getBalance();
      }
      case "place_order": {
        const quantity = Number.isInteger(input?.quantity) ? input.quantity : 1;
        const result = await placeRealOrder(input.item_id, quantity);
        if (!result.ok) {
          if (result.status === 402) {
            return { error: "Insufficient balance for this purchase." };
          }
          if (result.status === 404) {
            return { error: `This item is no longer available in the shop's catalogue.` };
          }
          return { error: "Could not place the order with the furniture shop right now." };
        }
        return {
          order_id: result.data.order_id,
          total_price: result.data.total_price,
          remaining_balance: result.data.remaining_balance,
        };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    console.error(`Agent tool "${name}" failed:`, error);
    return { error: "Something went wrong calling the furniture shop API." };
  }
}
