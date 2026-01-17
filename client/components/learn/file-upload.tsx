"use client";

import { useState, useRef } from "react";
import { ImageIcon, FileIcon, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onChange: (url: string) => void;
  value?: string;
  accept?: string;
  type?: "image" | "file";
}

export const FileUpload = ({
  onChange,
  value,
  accept = "image/*",
  type = "image",
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onChange(base64);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (value) {
    return (
      <div className="relative">
        {type === "image" ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <img src={value} alt="Upload" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border bg-slate-100 p-3 dark:bg-slate-800">
            <FileIcon className="h-8 w-8 text-primary" />
            <span className="truncate text-sm">Uploaded file</span>
          </div>
        )}
        <Button
          onClick={handleRemove}
          variant="destructive"
          size="icon"
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-md border border-dashed bg-slate-100 p-12 transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      {type === "image" ? (
        <ImageIcon className="h-10 w-10 text-slate-400" />
      ) : (
        <Upload className="h-10 w-10 text-slate-400" />
      )}
      <p className="text-sm text-slate-500">
        {isUploading ? "Uploading..." : "Click to upload"}
      </p>
    </div>
  );
};
