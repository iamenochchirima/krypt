import { UserProgress, Purchase, Certificate, LearnUser, DashboardCourses, CourseWithProgress } from "./types";
import { categories } from "./categories";
import {
  getStoredProgress,
  saveStoredProgress,
  getStoredPurchases,
  saveStoredPurchases,
  getStoredCertificates,
  saveStoredCertificates,
  addOrUpdateProgress,
  addPurchase as addPurchaseToStorage,
  addCertificate as addCertificateToStorage,
  isUserEnrolled,
} from "./storage";

const createDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

export const mockUser: LearnUser = {
  id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  imageUrl: "/images/avatars/default.jpg",
  isTeacher: false,
};

export const mockTeacher: LearnUser = {
  id: "instructor-1",
  name: "Alex Chen",
  email: "alex@cryptoverse.com",
  imageUrl: "/images/instructors/alex.jpg",
  isTeacher: true,
};

export const seedProgress: UserProgress[] = [
  { id: "up-1", userId: "user-1", chapterId: "course-1-ch-1", isCompleted: true, createdAt: createDate(20).toISOString(), updatedAt: createDate(20).toISOString() },
  { id: "up-2", userId: "user-1", chapterId: "course-1-ch-2", isCompleted: true, createdAt: createDate(18).toISOString(), updatedAt: createDate(18).toISOString() },
  { id: "up-3", userId: "user-1", chapterId: "course-1-ch-3", isCompleted: true, createdAt: createDate(15).toISOString(), updatedAt: createDate(15).toISOString() },
  { id: "up-4", userId: "user-1", chapterId: "course-1-ch-4", isCompleted: true, createdAt: createDate(12).toISOString(), updatedAt: createDate(12).toISOString() },
  { id: "up-5", userId: "user-1", chapterId: "course-1-ch-5", isCompleted: true, createdAt: createDate(10).toISOString(), updatedAt: createDate(10).toISOString() },
  { id: "up-6", userId: "user-1", chapterId: "course-1-ch-6", isCompleted: true, createdAt: createDate(8).toISOString(), updatedAt: createDate(8).toISOString() },
  { id: "up-7", userId: "user-1", chapterId: "course-2-ch-1", isCompleted: true, createdAt: createDate(14).toISOString(), updatedAt: createDate(14).toISOString() },
  { id: "up-8", userId: "user-1", chapterId: "course-2-ch-2", isCompleted: true, createdAt: createDate(13).toISOString(), updatedAt: createDate(13).toISOString() },
  { id: "up-9", userId: "user-1", chapterId: "course-2-ch-3", isCompleted: true, createdAt: createDate(11).toISOString(), updatedAt: createDate(11).toISOString() },
  { id: "up-10", userId: "user-1", chapterId: "course-2-ch-4", isCompleted: true, createdAt: createDate(9).toISOString(), updatedAt: createDate(9).toISOString() },
  { id: "up-11", userId: "user-1", chapterId: "course-2-ch-5", isCompleted: true, createdAt: createDate(7).toISOString(), updatedAt: createDate(7).toISOString() },
  { id: "up-12", userId: "user-1", chapterId: "course-2-ch-6", isCompleted: true, createdAt: createDate(5).toISOString(), updatedAt: createDate(5).toISOString() },
  { id: "up-13", userId: "user-1", chapterId: "course-7-ch-1", isCompleted: true, createdAt: createDate(30).toISOString(), updatedAt: createDate(30).toISOString() },
  { id: "up-14", userId: "user-1", chapterId: "course-7-ch-2", isCompleted: true, createdAt: createDate(28).toISOString(), updatedAt: createDate(28).toISOString() },
  { id: "up-15", userId: "user-1", chapterId: "course-7-ch-3", isCompleted: true, createdAt: createDate(26).toISOString(), updatedAt: createDate(26).toISOString() },
  { id: "up-16", userId: "user-1", chapterId: "course-7-ch-4", isCompleted: true, createdAt: createDate(24).toISOString(), updatedAt: createDate(24).toISOString() },
  { id: "up-17", userId: "user-1", chapterId: "course-7-ch-5", isCompleted: true, createdAt: createDate(22).toISOString(), updatedAt: createDate(22).toISOString() },
  { id: "up-18", userId: "user-1", chapterId: "course-7-ch-6", isCompleted: true, createdAt: createDate(21).toISOString(), updatedAt: createDate(21).toISOString() },
  { id: "up-19", userId: "user-1", chapterId: "course-7-ch-7", isCompleted: true, createdAt: createDate(20).toISOString(), updatedAt: createDate(20).toISOString() },
];

export const seedPurchases: Purchase[] = [
  { id: "pur-1", userId: "user-1", courseId: "course-1", createdAt: createDate(25).toISOString(), updatedAt: createDate(25).toISOString() },
  { id: "pur-2", userId: "user-1", courseId: "course-2", createdAt: createDate(20).toISOString(), updatedAt: createDate(20).toISOString() },
  { id: "pur-3", userId: "user-1", courseId: "course-7", createdAt: createDate(35).toISOString(), updatedAt: createDate(35).toISOString() },
];

export const seedCertificates: Certificate[] = [
  {
    id: "cert-1",
    uniqueCode: "CERT-TRADE-001",
    userId: "user-1",
    courseId: "course-7",
    courseTitle: "Crypto Trading Fundamentals",
    completedAt: createDate(20).toISOString(),
    instructorName: "Jennifer Lee",
  },
];

const getProgress = (): UserProgress[] => {
  if (typeof window === "undefined") return seedProgress;
  const stored = getStoredProgress();
  return stored.length > 0 ? stored : seedProgress;
};

const getPurchases = (): Purchase[] => {
  if (typeof window === "undefined") return seedPurchases;
  const stored = getStoredPurchases();
  return stored.length > 0 ? stored : seedPurchases;
};

const getCertificates = (): Certificate[] => {
  if (typeof window === "undefined") return seedCertificates;
  const stored = getStoredCertificates();
  return stored.length > 0 ? stored : seedCertificates;
};

export const getUserProgress = (userId: string, chapterId: string): UserProgress | null => {
  return getProgress().find((p) => p.userId === userId && p.chapterId === chapterId) || null;
};

export const getUserProgressForCourse = (userId: string, courseId: string): UserProgress[] => {
  return getProgress().filter((p) => p.userId === userId && p.chapterId.startsWith(courseId));
};

export const hasPurchased = (userId: string, courseId: string): boolean => {
  return getPurchases().some((p) => p.userId === userId && p.courseId === courseId);
};

export const getPurchase = (userId: string, courseId: string): Purchase | null => {
  return getPurchases().find((p) => p.userId === userId && p.courseId === courseId) || null;
};

export const getCourseProgress = (userId: string, courseId: string, chapters: { id: string }[]): number => {
  if (!chapters || chapters.length === 0) return 0;
  const progress = getProgress();
  const completedChapters = progress.filter(
    (p) => p.userId === userId && p.chapterId.startsWith(courseId) && p.isCompleted
  ).length;
  return Math.round((completedChapters / chapters.length) * 100);
};

export const getDashboardCourses = (userId: string, courses: any[]): DashboardCourses => {
  const purchasedCourseIds = getPurchases()
    .filter((p) => p.userId === userId)
    .map((p) => p.courseId);

  const purchasedCourses: CourseWithProgress[] = purchasedCourseIds.map((courseId) => {
    const course = courses.find((c) => c.id === courseId)!;
    if (!course) return null;
    const progress = getCourseProgress(userId, courseId, course.chapters || []);
    return {
      ...course,
      category: categories.find((cat) => cat.id === course.categoryId) || null,
      chapters: course.chapters?.map((ch: any) => ({ id: ch.id })) || [],
      progress,
    };
  }).filter(Boolean) as CourseWithProgress[];

  return {
    completedCourses: purchasedCourses.filter((c) => c.progress === 100),
    coursesInProgress: purchasedCourses.filter((c) => c.progress !== null && c.progress < 100),
  };
};

export const getUserCertificates = (userId: string): Certificate[] => {
  return getCertificates().filter((c) => c.userId === userId);
};

export const getEnrolledCourses = (userId: string): string[] => {
  return getPurchases().filter((p) => p.userId === userId).map((p) => p.courseId);
};

export const markChapterComplete = (userId: string, chapterId: string): UserProgress => {
  return addOrUpdateProgress(userId, chapterId, true);
};

export const markChapterIncomplete = (userId: string, chapterId: string): UserProgress => {
  return addOrUpdateProgress(userId, chapterId, false);
};

export const enrollInCourse = (userId: string, courseId: string): Purchase => {
  return addPurchaseToStorage(userId, courseId);
};

export const awardCertificate = (
  userId: string,
  courseId: string,
  courseTitle: string,
  instructorName: string
): Certificate => {
  return addCertificateToStorage(userId, courseId, courseTitle, instructorName);
};
