import { ChapterData, AnalyticsData, CourseWithProgress } from "./types";
import { getCourseById, getPublishedCourses } from "./courses";
import { categories } from "./categories";
import { getUserProgress, getPurchase, getCourseProgress } from "./user-data";

export const getChapter = (params: {
  userId: string;
  chapterId: string;
  courseId: string;
}): ChapterData => {
  const course = getCourseById(params.courseId);
  if (!course) {
    return {
      chapter: null,
      course: null,
      muxData: null,
      attachments: [],
      nextChapter: null,
      userProgress: null,
      purchase: null,
    };
  }

  const chapter = course.chapters?.find((ch) => ch.id === params.chapterId) || null;
  const chapterIndex = course.chapters?.findIndex((ch) => ch.id === params.chapterId) ?? -1;
  const nextChapter = chapterIndex >= 0 && course.chapters ? course.chapters[chapterIndex + 1] || null : null;

  return {
    chapter,
    course: { price: course.price },
    muxData: chapter?.muxData || null,
    attachments: course.attachments || [],
    nextChapter,
    userProgress: getUserProgress(params.userId, params.chapterId),
    purchase: getPurchase(params.userId, params.courseId),
  };
};

export const getCourses = (params: {
  userId: string;
  title?: string;
  categoryId?: string;
}): CourseWithProgress[] => {
  let filteredCourses = getPublishedCourses();

  if (params.title) {
    const query = params.title.toLowerCase();
    filteredCourses = filteredCourses.filter(
      (c) => c.title.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query)
    );
  }

  if (params.categoryId) {
    filteredCourses = filteredCourses.filter((c) => c.categoryId === params.categoryId);
  }

  return filteredCourses.map((course) => ({
    ...course,
    category: categories.find((cat) => cat.id === course.categoryId) || null,
    chapters: course.chapters?.map((ch) => ({ id: ch.id })) || [],
    progress: course.chapters ? getCourseProgress(params.userId, course.id, course.chapters) : null,
  }));
};

export const getAnalytics = (userId: string): AnalyticsData => {
  const teacherCourses = getPublishedCourses().filter((c) => c.userId === userId);

  const data = teacherCourses.map((course) => ({
    name: course.title.length > 20 ? course.title.substring(0, 20) + "..." : course.title,
    total: course.enrolledCount * (course.price || 0),
  }));

  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
  const totalSales = teacherCourses.reduce((sum, course) => sum + course.enrolledCount, 0);

  return { data, totalRevenue, totalSales };
};

export const getTeacherCourses = (userId: string) => {
  const allCourses = getPublishedCourses();
  return allCourses.filter((c) => c.userId === userId);
};

export const getAllCategories = () => categories;
