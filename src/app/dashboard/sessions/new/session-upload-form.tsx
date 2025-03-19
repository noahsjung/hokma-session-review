"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileAudio, Upload } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SessionUploadFormProps {
  createSessionAction: (formData: FormData) => Promise<any>;
}

export default function SessionUploadForm({
  createSessionAction,
}: SessionUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await createSessionAction(formData);
      // Handle success
      if (result?.id) {
        router.push(`/dashboard/sessions/${result.id}`);
      } else {
        router.push("/dashboard/sessions");
      }
    } catch (error) {
      console.error("Error uploading session:", error);
      // Handle error
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            Session Title
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter a descriptive title"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Add any notes or context about this session"
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="session_date" className="text-sm font-medium">
            Session Date
          </Label>
          <Input
            id="session_date"
            name="session_date"
            type="date"
            required
            className="mt-1"
            defaultValue={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <Label htmlFor="recording" className="text-sm font-medium">
            Audio Recording
          </Label>
          <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              id="recording"
              name="recording"
              type="file"
              accept="audio/*"
              required
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="recording" className="cursor-pointer block">
              <FileAudio
                className={`mx-auto h-12 w-12 ${selectedFile ? "text-blue-500" : "text-gray-400"}`}
              />
              <div className="mt-2 flex text-sm text-gray-600 justify-center">
                <Upload className="mr-1 h-5 w-5 text-gray-400" />
                <span>Click to upload or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                MP3, WAV, or M4A up to 500MB
              </p>
              {selectedFile && (
                <div className="mt-2 text-sm font-medium text-blue-600">
                  {selectedFile.name} (
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <span className="animate-spin">⏳</span> Uploading...
            </>
          ) : (
            "Upload Session"
          )}
        </Button>
      </div>
    </form>
  );
}
