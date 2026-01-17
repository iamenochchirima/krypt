"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  DollarSign,
  Users,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { getAnalytics, getTeacherCourses, mockTeacher } from "@/data/learn";

export default function AnalyticsPage() {
  const analytics = getAnalytics(mockTeacher.id);
  const courses = getTeacherCourses(mockTeacher.id);

  const maxRevenue = Math.max(...analytics.data.map((d) => d.total), 1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/learn/teacher"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your course performance and revenue.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-500">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">
                ${analytics.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">
                {analytics.totalSales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-purple-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. per Course</p>
              <p className="text-2xl font-bold">
                ${courses.length > 0 ? Math.round(analytics.totalRevenue / courses.length).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-xl font-bold">Revenue by Course</h2>
          {analytics.data.length > 0 ? (
            <div className="space-y-4">
              {analytics.data.map((item, index) => (
                <div key={index}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ${item.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(item.total / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No revenue data yet</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-xl font-bold">Course Performance</h2>
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{course.title}</p>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{course.enrolledCount} students</span>
                    <span>${course.price || 0}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        course.isPublished
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/learn/teacher/courses/${course.id}`}>Edit</Link>
                </Button>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No courses yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
