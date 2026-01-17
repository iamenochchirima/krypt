"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, CheckCircle, Play } from "lucide-react";
import { getDashboardCourses, getCourseById, mockUser, getPublishedCourses } from "@/data/learn";

export default function MyCoursesPage() {
  const courses = getPublishedCourses();
  const { completedCourses, coursesInProgress } = getDashboardCourses(mockUser.id, courses);

  const allCourses = [...coursesInProgress, ...completedCourses];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">My Learning</h1>
        <p className="text-muted-foreground">
          Track your progress and continue where you left off.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allCourses.length}</p>
              <p className="text-sm text-muted-foreground">Enrolled Courses</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coursesInProgress.length}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCourses.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="in-progress" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="in-progress">
            In Progress ({coursesInProgress.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({allCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress">
          {coursesInProgress.length === 0 ? (
            <EmptyState
              title="No courses in progress"
              description="Start learning today by enrolling in a course."
            />
          ) : (
            <CourseGrid courses={coursesInProgress} />
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedCourses.length === 0 ? (
            <EmptyState
              title="No completed courses yet"
              description="Complete your first course to see it here."
            />
          ) : (
            <CourseGrid courses={completedCourses} showCompleted />
          )}
        </TabsContent>

        <TabsContent value="all">
          {allCourses.length === 0 ? (
            <EmptyState
              title="No enrolled courses"
              description="Browse our catalog and start learning."
            />
          ) : (
            <CourseGrid courses={allCourses} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-muted-foreground">{description}</p>
      <Button asChild>
        <Link href="/learn">Browse Courses</Link>
      </Button>
    </div>
  );
}

function CourseGrid({
  courses,
  showCompleted = false,
}: {
  courses: ReturnType<typeof getDashboardCourses>["coursesInProgress"];
  showCompleted?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const fullCourse = getCourseById(course.id);
        return (
          <div key={course.id} className="crypto-card">
            <div className="relative mb-4 h-32 w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={course.imageUrl || "/placeholder.svg"}
                alt={course.title}
                fill
                className="object-cover"
              />
              {course.progress === 100 && (
                <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="mb-2 flex items-center gap-2">
              {course.category && (
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                  {course.category.name}
                </span>
              )}
            </div>

            <h3 className="mb-2 line-clamp-2 font-bold">{course.title}</h3>

            <div className="mb-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{course.progress}%</span>
              </div>
              <Progress value={course.progress || 0} className="h-2" />
            </div>

            <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {course.chapters.length} lessons
              </span>
              {fullCourse && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {fullCourse.duration}
                </span>
              )}
            </div>

            <Button className="w-full" asChild>
              <Link href={`/learn/${course.id}`}>
                {course.progress === 100
                  ? "Review Course"
                  : course.progress && course.progress > 0
                  ? "Continue"
                  : "Start"}
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
