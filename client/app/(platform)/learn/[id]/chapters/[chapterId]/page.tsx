"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Menu,
  X,
  Play,
} from "lucide-react";
import {
  getChapter,
  getCourseById,
  getUserProgressForCourse,
  hasPurchased,
  mockUser,
  markChapterComplete,
  markChapterIncomplete,
  getCourseProgress,
  awardCertificate,
} from "@/data/learn";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { toast } from "sonner";

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const confetti = useConfettiStore();
  const courseId = params.id as string;
  const chapterId = params.chapterId as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const course = getCourseById(courseId);
  const chapterData = getChapter({
    userId: mockUser.id,
    courseId,
    chapterId,
  });

  const enrolled = hasPurchased(mockUser.id, courseId);
  const progressData = getUserProgressForCourse(mockUser.id, courseId);
  const completedChapterIds = progressData
    .filter((p) => p.isCompleted)
    .map((p) => p.chapterId);

  useEffect(() => {
    setIsCompleted(completedChapterIds.includes(chapterId));
    if (course?.chapters) {
      setProgressPercent(getCourseProgress(mockUser.id, courseId, course.chapters));
    }
  }, [chapterId, completedChapterIds, course?.chapters, courseId]);

  if (!course || !chapterData.chapter) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Chapter not found</h1>
          <Button asChild>
            <Link href={`/learn/${courseId}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { chapter, nextChapter, attachments } = chapterData;
  const isLocked = !chapter.isFree && !enrolled;

  const currentIndex = course.chapters?.findIndex((ch) => ch.id === chapterId) ?? 0;
  const prevChapter = currentIndex > 0 ? course.chapters?.[currentIndex - 1] : null;

  const handleComplete = () => {
    if (!isCompleted) {
      markChapterComplete(mockUser.id, chapterId);
      setIsCompleted(true);
      toast.success("Progress saved!");

      if (course?.chapters) {
        const newCompletedCount = completedChapterIds.length + 1;
        const totalChapters = course.chapters.length;
        const newProgress = Math.round((newCompletedCount / totalChapters) * 100);
        setProgressPercent(newProgress);

        if (newProgress === 100) {
          confetti.onOpen();
          awardCertificate(
            mockUser.id,
            courseId,
            course.title,
            course.instructor?.name || "Instructor"
          );
          toast.success("Congratulations! You've completed the course!");
        }
      }
    } else {
      markChapterIncomplete(mockUser.id, chapterId);
      setIsCompleted(false);
      if (course?.chapters) {
        const newProgress = getCourseProgress(mockUser.id, courseId, course.chapters);
        setProgressPercent(newProgress);
      }
    }
  };

  const handleNext = () => {
    if (nextChapter) {
      router.push(`/learn/${courseId}/chapters/${nextChapter.id}`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <button
        className="fixed left-4 top-20 z-50 rounded-lg bg-background p-2 shadow-lg lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 transform border-r bg-background pt-16 transition-transform lg:relative lg:translate-x-0 lg:pt-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <Link
              href={`/learn/${courseId}`}
              className="mb-2 flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to course
            </Link>
            <h2 className="line-clamp-2 font-semibold">{course.title}</h2>
            {enrolled && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {course.chapters?.map((ch, index) => {
                const isActive = ch.id === chapterId;
                const isChapterCompleted = completedChapterIds.includes(ch.id);
                const isChapterLocked = !ch.isFree && !enrolled;

                return (
                  <Link
                    key={ch.id}
                    href={isChapterLocked ? "#" : `/learn/${courseId}/chapters/${ch.id}`}
                    className={`flex items-center gap-3 rounded-lg p-3 text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : isChapterLocked
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      if (isChapterLocked) e.preventDefault();
                      setSidebarOpen(false);
                    }}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                      {isChapterCompleted ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : isChapterLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border text-xs">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <span className="line-clamp-2">{ch.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        {isLocked ? (
          <div className="flex h-full flex-col items-center justify-center bg-muted/50 p-8 text-center">
            <Lock className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-bold">This chapter is locked</h2>
            <p className="mb-4 text-muted-foreground">
              Enroll in this course to access all chapters.
            </p>
            <Button asChild>
              <Link href={`/learn/${courseId}`}>Enroll Now</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl p-6">
            {isCompleted && (
              <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-500">
                You have completed this chapter.
              </div>
            )}

            <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl bg-black">
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-white">
                  <Play className="mx-auto mb-4 h-16 w-16 opacity-50" />
                  <p className="text-sm opacity-70">Video Player Placeholder</p>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold">{chapter.title}</h1>
              <Button
                variant={isCompleted ? "outline" : "default"}
                onClick={handleComplete}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </>
                ) : (
                  "Mark as Complete"
                )}
              </Button>
            </div>

            {chapter.description && (
              <div className="mb-8 rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Description</h3>
                <p className="text-muted-foreground">{chapter.description}</p>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 font-semibold">Resources</h3>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border bg-primary/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-6">
              {prevChapter ? (
                <Button variant="outline" asChild>
                  <Link href={`/learn/${courseId}/chapters/${prevChapter.id}`}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <div />
              )}
              {nextChapter ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button asChild>
                  <Link href={`/learn/${courseId}`}>Finish Course</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
