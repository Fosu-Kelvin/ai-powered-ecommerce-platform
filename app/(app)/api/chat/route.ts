import { createShoppingAgent } from "@/lib/ai/shopping-agent";
import { auth } from "@clerk/nextjs/server";
import { convertToCoreMessages, formatDataStreamPart } from "ai";

function createFallbackStreamResponse(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(formatDataStreamPart("text", text)));
      controller.enqueue(
        encoder.encode(
          formatDataStreamPart("finish_message", {
            finishReason: "stop",
            usage: {
              promptTokens: 0,
              completionTokens: 0,
            },
          })
        )
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1",
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body: messages[] is required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError) {
      console.warn("Chat auth unavailable, proceeding as guest:", authError);
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return createFallbackStreamResponse(
        "AI chat is not configured yet. Add GOOGLE_GENERATIVE_AI_API_KEY to your server environment and restart the app."
      );
    }

    const coreMessages = convertToCoreMessages(messages);

    try {
      // 1. Attempt to call the Gemini Agent
      const result = await createShoppingAgent({ 
        userId, 
        messages: coreMessages 
      });

      // 2. Return the stream response
      return result.toDataStreamResponse({
        getErrorMessage: (error) => {
          console.error("Stream error in /api/chat:", error);
          return "I couldn't complete that response. Please try again.";
        },
      });

    } catch (aiError: any) {
      console.warn("AI SDK error in /api/chat:", aiError);

      // 3. Protocol-safe fallback response
      return createFallbackStreamResponse(
        "I couldn't reach the AI service just now. Please try again in a moment."
      );
    }
    
  } catch (error: any) {
    console.error("CRITICAL_ROUTE_ERROR:", error);
    return new Response(JSON.stringify({ error: "Service temporarily offline." }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
