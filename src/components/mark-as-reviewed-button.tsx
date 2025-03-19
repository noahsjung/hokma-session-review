"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";

export default function MarkAsReviewedButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();

  const handleMarkAsReviewed = async () => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("sessions")
        .update({ status: "reviewed" })
        .eq("id", sessionId);

      if (error) {
        console.error("Error updating session status:", error);
        return;
      }

      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error("Error marking session as reviewed:", error);
    }
  };

  return <Button onClick={handleMarkAsReviewed}>Mark as Reviewed</Button>;
}
