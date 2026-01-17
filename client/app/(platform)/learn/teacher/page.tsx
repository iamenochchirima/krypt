"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, DollarSign, Users, BarChart3 } from "lucide-react";
import { getTeacherCourses, getAnalytics, mockTeacher } from "@/data/learn";

export default function TeacherDashboardPage() {
  const courses = getTeacherCourses(mockTeacher.id);
  const analytics = getAnalytics(mockTeacher.id);

  const publishedCourses = courses.filter((c) => c.isPublished);
  const draftCourses = courses.filter((c) => !c.isPublished);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your courses and track performance.
          </p>
        </div>
        <Button asChild>
          <Link href="/learn/teacher/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${analytics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {analytics.totalSales.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-500">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedCourses.length}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Courses</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/learn/teacher/courses">View All</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {courses.slice(0, 5).map((course) => (
              <Link key={course.id} href={`/learn/teacher/courses/${course.id}`}>
                <div className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
                  <div className="h-16 w-24 shrink-0 rounded-lg bg-muted" />
                  <div className="flex-1 overflow-hidden">
                    <h3 className="truncate font-medium">{course.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          course.isPublished
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </span>
                      <span>{course.chapters?.length || 0} chapters</span>
                      <span>${course.price || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {courses.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <BookOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No courses yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create your first course to start teaching.
                </p>
                <Button asChild>
                  <Link href="/learn/teacher/create">Create Course</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Revenue by Course</h2>
          </div>
          <div className="rounded-lg border bg-card p-4">
            {analytics.data.length > 0 ? (
              <div className="space-y-4">
                {analytics.data.map((item, index) => (
                  <div key={index}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate">{item.name}</span>
                      <span className="font-medium">${item.total.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${
                            (item.total / Math.max(...analytics.data.map((d) => d.total))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No revenue data yet
              </p>
            )}
          </div>

          <div className="mt-6">
            <Button className="w-full" variant="outline" asChild>
              <Link href="/learn/teacher/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Full Analytics
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
