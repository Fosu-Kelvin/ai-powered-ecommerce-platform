import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { searchProductsTool } from "./tools/search-products";
import { createGetMyOrdersTool } from "./tools/get-my-orders";

const GOOGLE_MODEL = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-1.5-flash";

interface ShoppingAgentOptions {
  userId: string | null;
  messages: any[];
}

export async function createShoppingAgent({ userId, messages }: ShoppingAgentOptions) {
  const baseInstructions = `You are a helpful and enthusiastic AI shopping assistant for "The UDS Shop", an e-commerce marketplace serving the University for Development Studies (UDS) community in Ghana.
  Your goal is to help students and staff discover and buy the right products.
  - Always be polite and professional.
  - Use Ghanaian Cedi (GH₵) for all prices.
  - Support all product categories available in the store.`;

  const ordersInstructions = userId 
    ? "You can help the user with their orders using the getMyOrders tool." 
    : "If the user asks about their orders, tell them they need to sign in first.";

  const instructions = `${baseInstructions}\n${ordersInstructions}`;

  const tools: any = {
    searchProducts: searchProductsTool,
  };

  const getMyOrdersTool = createGetMyOrdersTool(userId);
  if (getMyOrdersTool) {
    tools.getMyOrders = getMyOrdersTool;
  }

  return streamText({
    model: google(GOOGLE_MODEL),
    system: instructions,
    messages,
    tools,
    maxSteps: 10,
  });
}
