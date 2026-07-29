// The four furniture shop API actions, wired up as tools for the shopping
// assistant agent (src/app/api/agent/route.js). Names/descriptions match the
// design worked out before building this: each description is explicit about
// what the underlying API can and can't do, since the model can only be as
// honest as the text we give it. Shaped as native OpenAI/Azure OpenAI
// function tools (the agent's only consumer of this list).
import { searchCatalogue, toDisplayProduct, getProductDetail, getBalance, placeRealOrder } from "@/lib/productApi";

export const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_catalogue",
      description:
        "Look up furniture items by exact category name, with pagination. Returns name, price, category, and dimensions for every match. " +
        "This only does an exact, case-insensitive category match - there is no keyword search, price filter, or colour filter. " +
        "If the user wants something cheap, a specific colour, or a vague vibe ('modern', 'for a kid's room'), fetch the relevant " +
        "category/categories and apply that judgement yourself over the returned results - do not expect the API to understand it.",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description:
        "Get full details, including exact dimensions, for one specific item_id you already know (e.g. from a prior search_catalogue result). " +
        "Not for browsing or search - it only works for a single already-known item.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "The item's item_id, from a prior search_catalogue result." },
        },
        required: ["item_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_balance",
      description:
        "Check the current user's real remaining balance in the live event system. There is no user selection - it always reports on the " +
        "one identity this app is authorized as. This is a real balance for the event, not a sandbox number.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "place_order",
      description:
        "Purchase a given item_id and quantity. Two-step by design - the first call is always just a priced preview, never a real purchase: " +
        "call this with confirmed omitted (or false) to get back the item's name, unit price, total price, and current balance, with no " +
        "money moving at all. Show that preview to the user in plain text and wait for their explicit go-ahead in their own next message - " +
        "never assume or fabricate their confirmation. Only after they clearly confirm should you call this again with confirmed: true, which " +
        "immediately and irreversibly debits the user's real balance - a genuine transaction, not a quote or a dry run. Still be ready to " +
        "handle a 402 (insufficient balance) or 404 (item no longer available) response gracefully even on the confirmed call - the catalogue " +
        "and balance can change between calls.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "The item's item_id to purchase." },
          quantity: { type: "integer", description: "How many to buy. Defaults to 1.", minimum: 1 },
          confirmed: {
            type: "boolean",
            description:
              "Leave false/omitted for the initial preview (no purchase happens). Set true only after the user has explicitly confirmed " +
              "this exact purchase in their own message - this is what actually triggers the real, irreversible order.",
          },
        },
        required: ["item_id"],
      },
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

        // Preview-only pass: no purchase happens here. The server (not just
        // the prompt) uses this flag to hard-stop the tool loop the moment
        // one of these comes back, so a real purchase can never land in the
        // same turn the model first proposes it - see route.js.
        if (input?.confirmed !== true) {
          const detail = await getProductDetail(input.item_id);
          if (!detail) {
            return {
              error: "item_not_found",
              message: `Item '${input.item_id}' doesn't exist in the shop's catalogue.`,
              suggestion: "Tell the user this item isn't available. Use search_catalogue to help them find a real alternative.",
            };
          }
          const balance = await getBalance();
          const totalPrice = detail.price * quantity;
          return {
            requires_confirmation: true,
            item_id: detail.item_id,
            name: detail.product_name,
            quantity,
            unit_price: detail.price,
            total_price: totalPrice,
            current_balance: balance.balance,
            note: "Preview only - nothing has been purchased yet. Present this to the user and wait for their explicit confirmation before calling place_order again with confirmed: true.",
          };
        }

        const result = await placeRealOrder(input.item_id, quantity);
        if (!result.ok) {
          if (result.status === 402) {
            const balance = await getBalance().catch(() => null);
            return {
              error: "insufficient_balance",
              message: "The purchase did not go through - the balance is too low to cover this order.",
              current_balance: balance?.balance ?? null,
              suggestion:
                "Tell the user their current balance and that this order doesn't fit. Suggest a lower quantity, or use search_catalogue to find a cheaper item in the same category.",
            };
          }
          if (result.status === 404) {
            return {
              error: "item_not_found",
              message: `Item '${input.item_id}' is no longer available in the shop's catalogue.`,
              suggestion:
                "Tell the user this specific item is no longer available. Use search_catalogue again for the same category to offer a current alternative.",
            };
          }
          return {
            error: "order_failed",
            message: "Could not place the order with the furniture shop right now.",
            suggestion: "Tell the user the shop couldn't be reached and suggest trying again in a moment.",
          };
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
