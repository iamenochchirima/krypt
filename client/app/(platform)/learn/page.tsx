"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Clock, Users, Star, BookOpen } from "lucide-react";
import { courses, categories, Difficulty } from "@/data/learn";

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (!course.isPublished) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !course.title.toLowerCase().includes(query) &&
          !course.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      if (selectedCategory !== "all" && course.categoryId !== selectedCategory) {
        return false;
      }

      if (selectedDifficulty !== "all" && course.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Learn</h1>
        <p className="text-muted-foreground">
          Master blockchain development with comprehensive courses from industry experts.
        </p>
      </div>

      <div className="mb-8 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <Link key={course.id} href={`/learn/${course.id}`}>
            <div className="crypto-card group h-full cursor-pointer">
              <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={course.imageUrl || "/placeholder.svg"}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {course.price && course.price > 0 ? (
                  <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                    ${course.price}
                  </div>
                ) : (
                  <div className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white">
                    Free
                  </div>
                )}
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
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

              <h3 className="mb-2 line-clamp-2 text-lg font-bold group-hover:text-primary">
                {course.title}
              </h3>
              <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                {course.description}
              </p>

              <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.chapters?.length || 0} lessons
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted" />
                  <span className="text-sm">{course.instructor.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-medium">{course.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({course.enrolledCount.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No courses found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
