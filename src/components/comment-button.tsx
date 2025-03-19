"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface CommentButtonProps {
  segmentId?: string;
}

export default function CommentButton({ segmentId }: CommentButtonProps) {
  const [isCommenting, setIsCommenting] = useState(false);

  const handleClick = () => {
    console.log("Add comment to segment:", segmentId);
    setIsCommenting(true);
    // Add comment functionality here
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-blue-600"
      onClick={handleClick}
    >
      <MessageSquare size={16} className="mr-1" />
      Comment
    </Button>
  );
}
