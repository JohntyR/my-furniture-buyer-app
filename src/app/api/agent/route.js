import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/auth";
import { AGENT_TOOLS, runAgentTool } from "@/lib/agentTools";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a shopping assistant for a furniture shop, helping the logged-in user browse the real catalogue, check their real balance, and place real orders through your tools.

Be honest about what your tools can and can't do:
- search_catalogue only matches an exact category name - it has no keyword, price, or colour filter. If the user wants something "cheap", a specific colour, or a vague vibe, fetch the relevant category and apply that judgement yourself over the results - never claim the tool itself understood that request.
- get_product_details only works for one item you already know the item_id of (e.g. from a search_catalogue result) - it's not a way to search.
- check_balance and place_order always act on the one real identity this app is authorized as - there's no other user to check or act as.

Money is real: place_order genuinely and irreversibly debits the user's real balance. Always confirm the item, quantity, and total cost with the user before calling place_order - never place an order the user hasn't clearly asked for. Before confirming, compute the expected total yourself (price x quantity) and check it against the user's balance so you can flag it upfront if it won't fit, but still handle a 402 (insufficient balance) or 404 (item unavailable) result gracefully if it happens anyway - just explain plainly what went wrong.

Only state facts your tools actually returned - don't invent prices, stock, or details for items you haven't looked up. Keep responses concise and conversational.`;

const MAX_TOOL_ROUNDS = 8;

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

  const messages = [...(Array.isArray(history) ? history : []), { role: "user", content: message }];

  let reply = "";
  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 4096,
        output_config: { effort: "medium" },
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "refusal") {
        reply = "I can't help with that request.";
        break;
      }

      const toolUses = response.content.filter((block) => block.type === "tool_use");

      if (toolUses.length === 0) {
        reply = response.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("\n");
        break;
      }

      const toolResults = await Promise.all(
        toolUses.map(async (toolUse) => ({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(await runAgentTool(toolUse.name, toolUse.input)),
        }))
      );

      messages.push({ role: "user", content: toolResults });

      if (round === MAX_TOOL_ROUNDS - 1) {
        reply = "That's taking more steps than expected - could you try rephrasing or simplifying your request?";
      }
    }
  } catch (error) {
    console.error("Agent request failed:", error);
    return NextResponse.json(
      { error: "The assistant hit an error talking to Claude. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply, messages });
}
