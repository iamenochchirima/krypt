import { CourseWithMeta, Category, UserProgress, Purchase, Certificate } from "./types";

const STORAGE_KEYS = {
  COURSES: "learn_courses",
  CATEGORIES: "learn_categories",
  USER_PROGRESS: "learn_user_progress",
  PURCHASES: "learn_purchases",
  CERTIFICATES: "learn_certificates",
  INITIALIZED: "learn_initialized",
};

const isBrowser = typeof window !== "undefined";

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
}

export function initializeStorage(
  seedCourses: CourseWithMeta[],
  seedCategories: Category[],
  seedProgress: UserProgress[],
  seedPurchases: Purchase[],
  seedCertificates: Certificate[]
): void {
  if (!isBrowser) return;
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (isInitialized) return;

  saveToStorage(STORAGE_KEYS.COURSES, seedCourses);
  saveToStorage(STORAGE_KEYS.CATEGORIES, seedCategories);
  saveToStorage(STORAGE_KEYS.USER_PROGRESS, seedProgress);
  saveToStorage(STORAGE_KEYS.PURCHASES, seedPurchases);
  saveToStorage(STORAGE_KEYS.CERTIFICATES, seedCertificates);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
}

export function resetStorage(
  seedCourses: CourseWithMeta[],
  seedCategories: Category[],
  seedProgress: UserProgress[],
  seedPurchases: Purchase[],
  seedCertificates: Certificate[]
): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  initializeStorage(seedCourses, seedCategories, seedProgress, seedPurchases, seedCertificates);
}

export function getStoredCourses(): CourseWithMeta[] {
  return getFromStorage<CourseWithMeta[]>(STORAGE_KEYS.COURSES, []);
}

export function saveStoredCourses(courses: CourseWithMeta[]): void {
  saveToStorage(STORAGE_KEYS.COURSES, courses);
}

export function getStoredCategories(): Category[] {
  return getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
}

export function saveStoredCategories(categories: Category[]): void {
  saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
}

export function getStoredProgress(): UserProgress[] {
  return getFromStorage<UserProgress[]>(STORAGE_KEYS.USER_PROGRESS, []);
}

export function saveStoredProgress(progress: UserProgress[]): void {
  saveToStorage(STORAGE_KEYS.USER_PROGRESS, progress);
}

export function getStoredPurchases(): Purchase[] {
  return getFromStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
}

export function saveStoredPurchases(purchases: Purchase[]): void {
  saveToStorage(STORAGE_KEYS.PURCHASES, purchases);
}

export function getStoredCertificates(): Certificate[] {
  return getFromStorage<Certificate[]>(STORAGE_KEYS.CERTIFICATES, []);
}

export function saveStoredCertificates(certificates: Certificate[]): void {
  saveToStorage(STORAGE_KEYS.CERTIFICATES, certificates);
}

export function updateStoredCourse(courseId: string, updates: Partial<CourseWithMeta>): CourseWithMeta | null {
  const courses = getStoredCourses();
  const index = courses.findIndex(c => c.id === courseId);
  if (index === -1) return null;
  courses[index] = { ...courses[index], ...updates };
  saveStoredCourses(courses);
  return courses[index];
}

export function addOrUpdateProgress(userId: string, chapterId: string, isCompleted: boolean): UserProgress {
  const progress = getStoredProgress();
  const existingIndex = progress.findIndex(p => p.userId === userId && p.chapterId === chapterId);
  const now = new Date().toISOString();

  if (existingIndex !== -1) {
    progress[existingIndex] = { ...progress[existingIndex], isCompleted, updatedAt: now };
    saveStoredProgress(progress);
    return progress[existingIndex];
  }

  const newProgress: UserProgress = {
    id: `progress-${Date.now()}`,
    userId,
    chapterId,
    isCompleted,
    createdAt: now,
    updatedAt: now,
  };
  progress.push(newProgress);
  saveStoredProgress(progress);
  return newProgress;
}

export function addPurchase(userId: string, courseId: string): Purchase {
  const purchases = getStoredPurchases();
  const existing = purchases.find(p => p.userId === userId && p.courseId === courseId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const newPurchase: Purchase = {
    id: `purchase-${Date.now()}`,
    userId,
    courseId,
    createdAt: now,
    updatedAt: now,
  };
  purchases.push(newPurchase);
  saveStoredPurchases(purchases);
  return newPurchase;
}

export function isUserEnrolled(userId: string, courseId: string): boolean {
  const purchases = getStoredPurchases();
  return purchases.some(p => p.userId === userId && p.courseId === courseId);
}

export function addCertificate(
  userId: string,
  courseId: string,
  courseTitle: string,
  instructorName: string
): Certificate {
  const certificates = getStoredCertificates();
  const existing = certificates.find(c => c.userId === userId && c.courseId === courseId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const newCertificate: Certificate = {
    id: `cert-${Date.now()}`,
    uniqueCode: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    userId,
    courseId,
    courseTitle,
    completedAt: now,
    instructorName,
  };
  certificates.push(newCertificate);
  saveStoredCertificates(certificates);
  return newCertificate;
}

export function isStorageInitialized(): boolean {
  if (!isBrowser) return false;
  return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === "true";
}
