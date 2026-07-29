import { NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import { getCurrentUser } from "@/lib/auth";
import { AGENT_TOOLS, runAgentTool } from "@/lib/agentTools";

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
});

const MODEL = process.env.AZURE_OPENAI_DEPLOYMENT;

const SYSTEM_PROMPT = `You are a shopping assistant for a furniture shop, helping the logged-in user browse the real catalogue, check their real balance, and place real orders through your tools.

Be honest about what your tools can and can't do:
- search_catalogue only matches an exact category name - it has no keyword, price, or colour filter. If the user wants something "cheap", a specific colour, or a vague vibe, fetch the relevant category and apply that judgement yourself over the results - never claim the tool itself understood that request.
- search_catalogue_by_description handles open-ended, no-exact-category requests ("something cosy for a reading nook", "a Scandinavian side table but cheaper") by matching meaning, not keywords. It comes from a point-in-time catalogue export, not a live lookup, and has no colour data at all - never claim it filtered by colour, and always confirm price/availability with get_product_details before quoting a firm number or placing an order based on its results. Prefer search_catalogue when the user names an exact category.
- get_product_details only works for one item you already know the item_id of (e.g. from a search_catalogue or search_catalogue_by_description result) - it's not a way to search. When the user asks to see an item's details, your reply must state the actual facts the tool returned - name, item_id, price, category, colour(s), and dimensions - before asking anything else. Don't skip straight to a purchase question.
- check_balance and place_order always act on the one real identity this app is authorized as - there's no other user to check or act as.
- Your only capabilities are these five tools: searching/browsing the catalogue by category, semantic search over the catalogue by description, looking up one item's details, checking balance, and placing orders. There is no delivery scheduling, assembly service, shipping, returns, or any other capability - never offer or mention them, even as a follow-up suggestion. After a completed purchase or any other reply, only offer next steps you can actually do with these tools (e.g. browse more items, check balance, look up another item).

Money is real: place_order genuinely and irreversibly debits the user's real balance, and it is a two-step tool by design. The first call (confirmed omitted/false) is always just a priced preview - no money moves. Present that preview's item name, quantity, unit price, total price, and balance to the user in plain text and stop there - wait for the user's own next message to explicitly confirm before ever calling place_order again with confirmed: true. Never call place_order with confirmed: true in the same reply where you first proposed the purchase, and never assume or fabricate the user's confirmation. If they say no, or ask for something different, don't place the order.

If the confirmed purchase itself still fails (insufficient balance, or the item's gone from the catalogue), never surface the raw error, error code, or JSON - explain in one or two plain sentences what happened using the actual numbers/details the tool gave you, and always follow up with a concrete next step: for insufficient balance, state their current balance and suggest a lower quantity or a cheaper item (offer to search_catalogue the same category for one); for an item that's no longer available, say so and offer to re-run search_catalogue for a current alternative in that category. For any other order failure, say the shop couldn't be reached and suggest trying again shortly.

Every reply to the user must be a complete, natural-language message - never a placeholder, a meta-comment about the conversation (e.g. "(duplicate)"), or an empty/near-empty response. If the user asks you to do something you already discussed or asked about earlier (e.g. you suggested an item/quantity and they now confirm or repeat it), that is not a duplicate to refuse or skip - it's the answer to your own question, so go ahead and act on it normally (call the appropriate tool).

All prices your tools return are in Australian dollars - always show them with a "$" prefix (e.g. "$518.00"), never "£", "€", or any other currency symbol or code.

Only state facts your tools actually returned - don't invent prices, stock, or details for items you haven't looked up. Keep responses concise and conversational.`;

const MAX_TOOL_ROUNDS = 8;

// Catches not just too-short replies but meta-comments like "(duplicate)" -
// a bare parenthesized/bracketed remark is never a real answer, no matter
// its length.
function isPlaceholderReply(text) {
  return text.length < 8 || /^[([].*[)\]]$/.test(text);
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { message, messages: history } = body ?? {};
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  // The system prompt is re-added fresh on every request rather than stored
  // in the round-tripped history, so client-side state never carries it.
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(Array.isArray(history) ? history : []),
    { role: "user", content: message },
  ];

  let reply = "";
  // Product images the tools turned up along the way, keyed by itemId so the
  // same product surfaced twice (e.g. search then get_product_details)
  // only shows up once. This never goes into `messages` - it's a UI-only
  // side channel, returned alongside `reply` but never round-tripped back
  // into the model's context.
  const productImages = new Map();
  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages,
        tools: AGENT_TOOLS,
      });

      const choice = response.choices[0];
      const assistantMessage = choice.message;
      const toolCalls = assistantMessage.tool_calls ?? [];

      if (choice.finish_reason === "content_filter") {
        messages.push({ role: "assistant", content: assistantMessage.content ?? null });
        reply = "I can't help with that request.";
        break;
      }

      if (toolCalls.length === 0) {
        // The model occasionally ends a turn with no tool call and a
        // suspiciously short/placeholder-like reply (e.g. a bare "(duplicate)")
        // instead of actually answering. Give it one chance to try again with
        // a nudge before showing that to the user - the nudge itself isn't
        // saved to history, only whatever reply comes out of it.
        const text = (assistantMessage.content ?? "").trim();
        if (isPlaceholderReply(text)) {
          const retryResponse = await client.chat.completions.create({
            model: MODEL,
            messages: [
              ...messages,
              { role: "assistant", content: text || null },
              {
                role: "user",
                content:
                  "That reply didn't actually answer my message - please respond properly, in full natural language.",
              },
            ],
            tools: AGENT_TOOLS,
          });
          const retryText = (retryResponse.choices[0].message.content ?? "").trim();
          reply = retryText || "Sorry, could you rephrase that?";
        } else {
          reply = text;
        }
        messages.push({ role: "assistant", content: reply });
        break;
      }

      messages.push({
        role: "assistant",
        content: assistantMessage.content ?? null,
        tool_calls: toolCalls,
      });

      const rawResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          let input = {};
          try {
            input = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            input = {};
          }
          const { result, images } = await runAgentTool(toolCall.function.name, input);
          return { toolCall, result, images };
        })
      );

      for (const { toolCall, result, images } of rawResults) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
        for (const image of images) {
          productImages.set(image.itemId, image);
        }
      }

      // A place_order preview just came back (no purchase happened). This is
      // enforced here, not just in the prompt: let the model phrase the
      // confirmation ask in one more turn, then hard-stop for real - any
      // tool call it attempts in that same response (e.g. trying to confirm
      // the purchase itself) is discarded, so a real order can never be
      // placed in the same turn it was first proposed.
      const awaitingConfirmation = rawResults.some(({ result }) => result?.requires_confirmation);

      if (awaitingConfirmation) {
        const confirmResponse = await client.chat.completions.create({
          model: MODEL,
          messages,
          tools: AGENT_TOOLS,
        });

        let confirmText = (confirmResponse.choices[0].message.content ?? "").trim();

        // Same defensive retry as below - this extra call, where the model
        // comments on a tool call/result it just produced itself, is the
        // likeliest place for a short placeholder-style reply to slip out.
        if (isPlaceholderReply(confirmText)) {
          const retryResponse = await client.chat.completions.create({
            model: MODEL,
            messages: [
              ...messages,
              { role: "assistant", content: confirmText || null },
              {
                role: "user",
                content:
                  "That reply didn't actually present the order preview - please describe it properly, in full natural language.",
              },
            ],
            tools: AGENT_TOOLS,
          });
          confirmText = (retryResponse.choices[0].message.content ?? "").trim();
        }

        reply = confirmText || "Just to confirm - would you like me to go ahead with that purchase?";
        messages.push({ role: "assistant", content: reply });
        break;
      }

      if (round === MAX_TOOL_ROUNDS - 1) {
        reply = "That's taking more steps than expected - could you try rephrasing or simplifying your request?";
      }
    }
  } catch (error) {
    console.error("Agent request failed:", error);
    return NextResponse.json(
      { error: "The assistant hit an error talking to the model. Please try again." },
      { status: 502 }
    );
  }

  // Never send the system prompt back to the client (or it'll get round-tripped
  // into the next request's history alongside the fresh one added above).
  const historyToReturn = messages.filter((entry) => entry.role !== "system");

  return NextResponse.json({
    reply,
    messages: historyToReturn,
    products: Array.from(productImages.values()),
  });
}
