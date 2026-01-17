"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Play,
  Lock,
  Clock,
  BookOpen,
  Users,
  Star,
  FileText,
  Download,
  ChevronLeft,
} from "lucide-react";
import {
  getCourseById,
  getCourseProgress,
  hasPurchased,
  getUserProgressForCourse,
  mockUser,
  enrollInCourse,
} from "@/data/learn";
import { toast } from "sonner";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const course = getCourseById(courseId);
  const [enrolled, setEnrolled] = useState(hasPurchased(mockUser.id, courseId));

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Course not found</h1>
          <Button asChild>
            <Link href="/learn">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const progressData = getUserProgressForCourse(mockUser.id, courseId);
  const progress = enrolled && course.chapters
    ? getCourseProgress(mockUser.id, courseId, course.chapters)
    : 0;
  const completedChapterIds = progressData
    .filter((p) => p.isCompleted)
    .map((p) => p.chapterId);

  const handleEnroll = () => {
    enrollInCourse(mockUser.id, courseId);
    setEnrolled(true);
    toast.success("Successfully enrolled in course!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/learn"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Courses
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src={course.imageUrl || "/placeholder.svg"}
              alt={course.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Button size="lg" className="rounded-full" asChild>
                <Link href={`/learn/${courseId}/chapters/${course.chapters?.[0]?.id}`}>
                  <Play className="mr-2 h-5 w-5" /> Watch Preview
                </Link>
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  course.difficulty === "Beginner"
                    ? "bg-green-500/20 text-green-500"
                    : course.difficulty === "Intermediate"
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "bg-red-500/20 text-red-500"
                }`}
              >
                {course.difficulty}
              </span>
              {course.category && (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                  {course.category.name}
                </span>
              )}
            </div>
            <h1 className="mb-4 text-3xl font-bold">{course.title}</h1>
            <p className="text-lg text-muted-foreground">{course.description}</p>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{course.chapters?.length || 0} lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{course.enrolledCount.toLocaleString()} enrolled</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span>{course.rating} rating</span>
            </div>
          </div>

          <div className="mb-8 flex items-center gap-4 border-b pb-6">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div>
              <p className="font-medium">{course.instructor.name}</p>
              <p className="text-sm text-muted-foreground">Instructor</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-bold">What you'll learn</h2>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  "Understand core blockchain concepts",
                  "Build real-world applications",
                  "Industry best practices",
                  "Hands-on project experience",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold">Requirements</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Basic understanding of programming concepts</li>
                <li>• Familiarity with JavaScript is helpful but not required</li>
                <li>• A computer with internet access</li>
              </ul>
            </div>

            {course.attachments && course.attachments.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Resources</h2>
                <div className="space-y-2">
                  {course.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span>{attachment.name}</span>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-xl border bg-card p-6">
              {enrolled ? (
                <>
                  <div className="mb-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Your progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <Button className="mb-4 w-full" size="lg" asChild>
                    <Link href={`/learn/${courseId}/chapters/${course.chapters?.[0]?.id}`}>
                      {progress > 0 ? "Continue Learning" : "Start Course"}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4 text-center">
                    <span className="text-3xl font-bold">
                      {course.price ? `$${course.price}` : "Free"}
                    </span>
                  </div>
                  <Button className="mb-4 w-full" size="lg" onClick={handleEnroll}>
                    {course.price ? "Enroll Now" : "Start Free Course"}
                  </Button>
                </>
              )}
              <p className="text-center text-sm text-muted-foreground">
                30-day money-back guarantee
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold">Course Content</h3>
              <div className="mb-4 text-sm text-muted-foreground">
                {course.chapters?.length || 0} lessons • {course.duration}
              </div>
              <div className="space-y-2">
                {course.chapters?.map((chapter, index) => {
                  const isCompleted = completedChapterIds.includes(chapter.id);
                  const isLocked = !chapter.isFree && !enrolled;

                  return (
                    <Link
                      key={chapter.id}
                      href={
                        isLocked ? "#" : `/learn/${courseId}/chapters/${chapter.id}`
                      }
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        isLocked
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-muted"
                      } ${isCompleted ? "border-primary/50 bg-primary/5" : ""}`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : isLocked ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">
                          {chapter.title}
                        </p>
                        {chapter.isFree && !enrolled && (
                          <span className="text-xs text-green-500">Free preview</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
