"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  LayoutDashboard,
  Video,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Upload,
} from "lucide-react";
import {
  getCourseById,
  updateChapter,
  deleteChapter,
  publishChapter,
  unpublishChapter,
} from "@/data/learn";
import { toast } from "sonner";

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const chapterId = params.chapterId as string;

  const [course, setCourse] = useState(() => getCourseById(courseId));
  const chapter = course?.chapters?.find((ch) => ch.id === chapterId);

  const [title, setTitle] = useState(chapter?.title || "");
  const [description, setDescription] = useState(chapter?.description || "");
  const [videoUrl, setVideoUrl] = useState(chapter?.videoUrl || "");
  const [isFree, setIsFree] = useState(chapter?.isFree || false);
  const [isPublished, setIsPublished] = useState(chapter?.isPublished || false);
  const [editingField, setEditingField] = useState<string | null>(null);

  if (!course || !chapter) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Chapter not found</h1>
          <Button asChild>
            <Link href={`/learn/teacher/courses/${courseId}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  const requiredFields = [title, description, videoUrl];
  const completedFields = requiredFields.filter(Boolean).length;
  const totalFields = requiredFields.length;
  const isComplete = completedFields === totalFields;

  const handleSaveField = (field: string) => {
    const values: Record<string, any> = {};

    switch (field) {
      case "title":
        values.title = title;
        break;
      case "description":
        values.description = description;
        break;
      case "videoUrl":
        values.videoUrl = videoUrl;
        break;
    }

    const updated = updateChapter(courseId, chapterId, values);
    if (updated) {
      const refreshedCourse = getCourseById(courseId);
      if (refreshedCourse) setCourse({ ...refreshedCourse });
      toast.success("Chapter updated");
    }
    setEditingField(null);
  };

  const handleFreeToggle = (checked: boolean) => {
    setIsFree(checked);
    updateChapter(courseId, chapterId, { isFree: checked });
    const refreshedCourse = getCourseById(courseId);
    if (refreshedCourse) setCourse({ ...refreshedCourse });
    toast.success(checked ? "Chapter set as free preview" : "Chapter set as paid");
  };

  const handlePublish = () => {
    if (isPublished) {
      unpublishChapter(courseId, chapterId);
      setIsPublished(false);
      const refreshedCourse = getCourseById(courseId);
      if (refreshedCourse) setCourse({ ...refreshedCourse });
      toast.success("Chapter unpublished");
    } else {
      const result = publishChapter(courseId, chapterId);
      if (result.success) {
        setIsPublished(true);
        const refreshedCourse = getCourseById(courseId);
        if (refreshedCourse) setCourse({ ...refreshedCourse });
        toast.success("Chapter published");
      } else {
        toast.error(result.error || "Missing required fields");
      }
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      deleteChapter(courseId, chapterId);
      router.push(`/learn/teacher/courses/${courseId}`);
      toast.success("Chapter deleted");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/learn/teacher/courses/${courseId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to course setup
        </Link>
      </div>

      {!isPublished && (
        <div className="mb-6 rounded-lg bg-yellow-500/10 p-4 text-sm text-yellow-600">
          This chapter is unpublished. It will not be visible in the course.
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Chapter setup</h1>
          <p className="text-sm text-muted-foreground">
            Complete all fields ({completedFields}/{totalFields})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePublish}
            disabled={!isComplete && !isPublished}
          >
            {isPublished ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" /> Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" /> Publish
              </>
            )}
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            Customize your chapter
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Chapter title</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingField(editingField === "title" ? null : "title")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {editingField === "title" ? (
              <div className="space-y-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveField("title")}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{chapter.title}</p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Chapter description</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setEditingField(editingField === "description" ? null : "description")
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {editingField === "description" ? (
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveField("description")}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {chapter.description || "No description"}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Free preview</Label>
                <p className="text-xs text-muted-foreground">
                  Make this chapter free for preview
                </p>
              </div>
              <Switch checked={isFree} onCheckedChange={handleFreeToggle} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Video className="h-5 w-5 text-primary" />
            Add a video
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Chapter video</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingField(editingField === "videoUrl" ? null : "videoUrl")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            {editingField === "videoUrl" ? (
              <div className="space-y-2">
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Enter video URL"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a video URL (YouTube, Vimeo, or direct link)
                </p>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveField("videoUrl")}>
                    Save
                  </Button>
                </div>
              </div>
            ) : chapter.videoUrl ? (
              <div className="space-y-4">
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <div className="flex h-full items-center justify-center text-white">
                    <Video className="h-12 w-12 opacity-50" />
                  </div>
                </div>
                <p className="truncate text-xs text-muted-foreground">{chapter.videoUrl}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 py-12">
                <Video className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">No video uploaded</p>
                <Button
                  variant="outline"
                  onClick={() => setEditingField("videoUrl")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Add Video URL
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
