"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import DashboardNavbar from "@/components/dashboard-navbar";
import { useRouter } from "next/navigation";
import { createDummySessionAction } from "./create-dummy-action";

export default function DummySessionPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateDummySession = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await createDummySessionAction();

      if (result.success && result.sessionId) {
        router.push(`/dashboard/sessions/${result.sessionId}`);
      } else {
        setError(result.error || "Failed to create dummy session");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating dummy session:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      setIsCreating(false);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-xl p-6 border shadow-sm">
            <h1 className="text-2xl font-bold mb-4">Create Dummy Session</h1>
            <p className="text-gray-600 mb-6">
              This will create a mock counseling session with transcript data
              for testing purposes.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                {error}
              </div>
            )}

            <Button
              onClick={handleCreateDummySession}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Dummy Session"}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
