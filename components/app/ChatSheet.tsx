"use client";

import { useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { useAuth } from "@clerk/nextjs";
import { Send, Loader2, X, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Message } from "ai";
import {
  useIsChatOpen,
  useChatActions,
  usePendingMessage,
} from "@/lib/store/chat-store-provider";
import {
  getMessageText,
  getToolParts,
  WelcomeScreen,
  MessageBubble,
  ToolCallUI,
} from "./chat";

export function ChatSheet() {
  const isOpen = useIsChatOpen();
  const { closeChat, clearPendingMessage } = useChatActions();
  const pendingMessage = usePendingMessage();
  const { isSignedIn } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🚀 Fixed: Removed 'status' to resolve ts(2339) and used 'isLoading' instead
  const { 
    messages, 
    setMessages,
    append, 
    isLoading, 
    input, 
    handleInputChange, 
    handleSubmit 
  } = useChat({
    api: "/api/chat",
    onError: (err) => {
      console.error("Chat Hook Error:", err);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I hit an error while processing that. Please try again.",
        },
      ]);
    },
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle product-specific questions (Pending Messages)
useEffect(() => {
  if (isOpen && pendingMessage && !isLoading) {
    append({ 
      id: crypto.randomUUID(), 
      role: "user", 
      // 🚀 Same logic here to ensure it's a string
      content: typeof pendingMessage === 'string' ? pendingMessage : (pendingMessage as any).text
    });
    clearPendingMessage();
  }
}, [isOpen, pendingMessage, isLoading, append, clearPendingMessage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-black text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">UDS Shop Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={closeChat} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          /* 🚀 Fixed: Added required props for WelcomeScreen ts(2739) */
         <WelcomeScreen 
  isSignedIn={isSignedIn ?? false}
  onSuggestionClick={(suggestion) => 
    append({ 
      id: crypto.randomUUID(), 
      role: "user", 
      // 🚀 Access .text since suggestion is an object { text: string }
      content: typeof suggestion === 'string' ? suggestion : suggestion.text
    })
  }
/>
        ) : (
          messages.map((m: Message) => (
            <div key={m.id} className="space-y-2">
              {/* Text Content */}
              {getMessageText(m) && (
                /* 🚀 Fixed: Added closeChat prop for MessageBubble ts(2741) */
                <MessageBubble 
                  role={m.role} 
                  content={getMessageText(m)} 
                  closeChat={closeChat}
                />
              )}
              
              {/* Tool Execution UI */}
              {getToolParts(m).map((part, idx) => (
                <ToolCallUI
                  key={`${m.id}-${idx}`}
                  toolPart={part}
                  closeChat={closeChat}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        {/* 🚀 Using 'isLoading' as a live status indicator */}
        {isLoading && (
          <div className="text-xs text-gray-500 mb-2 animate-pulse flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Assistant is thinking...
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={isSignedIn ? "Ask about products..." : "Sign in to check orders"}
            className="flex-1 bg-white"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
