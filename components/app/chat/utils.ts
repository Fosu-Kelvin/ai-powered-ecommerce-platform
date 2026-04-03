import { type Message } from "ai";
import type { ToolCallPart } from "./types";

/**
 * Extracts all text content from a message.
 * Handles both classic string content and modern array-of-parts content.
 */
export function getMessageText(message: Message): string {
  return typeof message.content === "string" ? message.content : "";
}

/**
 * Extracts tool calls from the message content array.
 */
export function getToolParts(message: Message): ToolCallPart[] {
  return (message.toolInvocations as ToolCallPart[] | undefined) ?? [];
}

/**
 * Maps technical tool names to human-readable labels for the UI.
 */
export function getToolDisplayName(toolName: string): string {
  const toolNames: Record<string, string> = {
    searchProducts: "Searching products",
    getMyOrders: "Getting your orders",
  };
  return toolNames[toolName] || toolName;
}
