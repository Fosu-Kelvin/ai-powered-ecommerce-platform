"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatActions } from "@/lib/store/chat-store-provider";

interface AskAISimilarButtonProps {
  productName: string;
  categoryName?: string | null;
}

export function AskAISimilarButton({
  productName,
  categoryName,
}: AskAISimilarButtonProps) {
  const { openChatWithMessage } = useChatActions();

  const handleClick = () => {
    const categoryHint = categoryName ? ` in ${categoryName}` : "";
    openChatWithMessage(
      `Show me products similar to "${productName}"${categoryHint}`
    );
  };

  return (
    <Button
      onClick={handleClick}
      className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:from-amber-600 hover:to-orange-700 hover:shadow-xl dark:from-amber-600 dark:to-orange-700 dark:hover:from-amber-700 dark:hover:to-orange-800"
    >
      <Sparkles className="h-4 w-4" />
      Ask AI for similar products
    </Button>
  );
}
