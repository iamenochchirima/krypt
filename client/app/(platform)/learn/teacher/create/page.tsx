"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { createCourse, mockTeacher } from "@/data/learn";

export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);

    const course = createCourse(mockTeacher.id, title);

    router.push(`/learn/teacher/courses/${course.id}`);
  };

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/learn/teacher"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="rounded-xl border bg-card p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold">Name your course</h1>
          <p className="text-muted-foreground">
            What would you like to name your course? Don't worry, you can change this later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Course title</Label>
            <Input
              id="title"
              placeholder="e.g. 'Advanced Web Development'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              What will you teach in this course?
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? "Creating..." : "Continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
