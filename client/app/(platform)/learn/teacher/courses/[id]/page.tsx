"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  LayoutDashboard,
  ListChecks,
  CircleDollarSign,
  FileText,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { ChaptersList } from "@/components/learn/chapters-list";
import { FileUpload } from "@/components/learn/file-upload";
import {
  getCourseById,
  categories,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  addChapter,
  deleteChapter,
  reorderChapters,
} from "@/data/learn";
import { toast } from "sonner";

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState(() => getCourseById(courseId));
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState(course?.title || "");
  const [description, setDescription] = useState(course?.description || "");
  const [imageUrl, setImageUrl] = useState(course?.imageUrl || "");
  const [price, setPrice] = useState(course?.price?.toString() || "");
  const [categoryId, setCategoryId] = useState(course?.categoryId || "");
  const [newChapterTitle, setNewChapterTitle] = useState("");

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Course not found</h1>
          <Button asChild>
            <Link href="/learn/teacher/courses">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const requiredFields = [title, description, imageUrl, price, categoryId];
  const completedFields = requiredFields.filter(Boolean).length;
  const totalFields = requiredFields.length;
  const hasPublishedChapter = course.chapters?.some((ch) => ch.isPublished);
  const isComplete = completedFields === totalFields && hasPublishedChapter;

  const handleSaveField = (field: string) => {
    const values: Record<string, any> = {};

    switch (field) {
      case "title":
        values.title = title;
        break;
      case "description":
        values.description = description;
        break;
      case "imageUrl":
        values.imageUrl = imageUrl;
        break;
      case "price":
        values.price = parseFloat(price) || null;
        break;
      case "category":
        values.categoryId = categoryId;
        break;
    }

    const updated = updateCourse(courseId, values);
    if (updated) {
      setCourse({ ...updated });
      toast.success("Course updated");
    }
    setEditingField(null);
  };

  const handlePublish = () => {
    if (course.isPublished) {
      unpublishCourse(courseId);
      setCourse({ ...course, isPublished: false });
      toast.success("Course unpublished");
    } else {
      const result = publishCourse(courseId);
      if (result.success) {
        setCourse({ ...course, isPublished: true });
        toast.success("Course published");
      } else {
        toast.error(result.error || "Missing required fields");
      }
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      deleteCourse(courseId);
      router.push("/learn/teacher/courses");
      toast.success("Course deleted");
    }
  };

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;

    const chapter = addChapter(courseId, newChapterTitle);
    if (chapter) {
      const updated = getCourseById(courseId);
      if (updated) setCourse({ ...updated });
      setNewChapterTitle("");
      toast.success("Chapter created");
    }
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (confirm("Are you sure you want to delete this chapter?")) {
      deleteChapter(courseId, chapterId);
      const updated = getCourseById(courseId);
      if (updated) setCourse({ ...updated });
      toast.success("Chapter deleted");
    }
  };

  const handleReorder = (updateData: { id: string; position: number }[]) => {
    reorderChapters(courseId, updateData);
    const updated = getCourseById(courseId);
    if (updated) setCourse({ ...updated });
    toast.success("Chapters reordered");
  };

  const handleEditChapter = (chapterId: string) => {
    router.push(`/learn/teacher/courses/${courseId}/chapters/${chapterId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/learn/teacher/courses"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Courses
        </Link>
      </div>

      {!course.isPublished && (
        <div className="mb-6 rounded-lg bg-yellow-500/10 p-4 text-sm text-yellow-600">
          This course is unpublished. It will not be visible to students.
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Course setup</h1>
          <p className="text-sm text-muted-foreground">
            Complete all fields ({completedFields}/{totalFields})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePublish}
            disabled={!isComplete && !course.isPublished}
          >
            {course.isPublished ? (
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
            Customize your course
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Course title</Label>
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
              <p className="text-sm text-muted-foreground">{course.title}</p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Description</Label>
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
                {course.description || "No description"}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Course image</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingField(editingField === "imageUrl" ? null : "imageUrl")}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            {editingField === "imageUrl" ? (
              <div className="space-y-2">
                <FileUpload
                  value={imageUrl}
                  onChange={(url) => {
                    setImageUrl(url);
                    if (url) {
                      updateCourse(courseId, { imageUrl: url });
                      const updated = getCourseById(courseId);
                      if (updated) setCourse({ ...updated });
                      toast.success("Image uploaded");
                      setEditingField(null);
                    }
                  }}
                  type="image"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : course.imageUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img src={course.imageUrl} alt={course.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted/50">
                <p className="text-sm text-muted-foreground">No image</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Category</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingField(editingField === "category" ? null : "category")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {editingField === "category" ? (
              <div className="space-y-2">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveField("category")}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {course.category?.name || "No category"}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ListChecks className="h-5 w-5 text-primary" />
            Course chapters
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-4">
              <Label className="text-sm font-medium">Add a chapter</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="e.g. 'Introduction to the course'"
                  onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
                />
                <Button onClick={handleAddChapter} disabled={!newChapterTitle.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {course.chapters && course.chapters.length > 0 ? (
              <ChaptersList
                items={course.chapters}
                onReorder={handleReorder}
                onEdit={handleEditChapter}
              />
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No chapters</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-lg font-semibold">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            Sell your course
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Price</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingField(editingField === "price" ? null : "price")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {editingField === "price" ? (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Set a price for your course"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveField("price")}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {course.price ? `$${course.price}` : "Free"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            Resources & Attachments
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Add files that students can download (coming soon)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
