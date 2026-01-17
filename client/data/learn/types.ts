export interface Category {
  id: string;
  name: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MuxData {
  id: string;
  assetId: string;
  playbackId: string | null;
  chapterId: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  chapterId: string;
  isCompleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Chapter {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  muxData?: MuxData | null;
  userProgress?: UserProgress[];
}

export interface Purchase {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: Category | null;
  chapters?: Chapter[];
  attachments?: Attachment[];
  purchases?: Purchase[];
}

export interface CourseWithChapters extends Course {
  chapters: Chapter[];
}

export interface CourseWithChaptersAndProgress extends Course {
  chapters: (Chapter & {
    userProgress: UserProgress[] | null;
  })[];
}

export interface CourseWithProgress extends Course {
  category: Category | null;
  chapters: { id: string }[];
  progress: number | null;
}

export interface ChapterWithMuxData extends Chapter {
  muxData: MuxData | null;
}

export interface ChapterData {
  chapter: Chapter | null;
  course: { price: number | null } | null;
  muxData: MuxData | null;
  attachments: Attachment[];
  nextChapter: Chapter | null;
  userProgress: UserProgress | null;
  purchase: Purchase | null;
}

export interface DashboardCourses {
  completedCourses: CourseWithProgress[];
  coursesInProgress: CourseWithProgress[];
}

export interface AnalyticsData {
  data: { name: string; total: number }[];
  totalRevenue: number;
  totalSales: number;
}

export interface LearnUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  isTeacher: boolean;
}

export interface Certificate {
  id: string;
  uniqueCode: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  completedAt: string;
  instructorName: string;
}

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface CourseWithMeta extends Course {
  category: Category | null;
  chapters: Chapter[];
  difficulty: Difficulty;
  duration: string;
  enrolledCount: number;
  rating: number;
  instructor: {
    name: string;
    imageUrl: string;
  };
}
