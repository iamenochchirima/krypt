import { CourseWithMeta, Chapter, Attachment, Difficulty } from "./types";
import { categories } from "./categories";
import {
  getStoredCourses,
  saveStoredCourses,
  isStorageInitialized,
  initializeStorage,
} from "./storage";
import { seedProgress, seedPurchases, seedCertificates } from "./user-data";

const createDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

const createChapters = (courseId: string, titles: string[], freeIndexes: number[] = [0]): Chapter[] => {
  return titles.map((title, index) => ({
    id: `${courseId}-ch-${index + 1}`,
    title,
    description: `Learn about ${title.toLowerCase()} in this comprehensive lesson.`,
    videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    position: index + 1,
    isPublished: true,
    isFree: freeIndexes.includes(index),
    courseId,
    createdAt: createDate(30),
    updatedAt: createDate(5),
    muxData: {
      id: `mux-${courseId}-${index + 1}`,
      assetId: `asset-${courseId}-${index + 1}`,
      playbackId: `playback-${courseId}-${index + 1}`,
      chapterId: `${courseId}-ch-${index + 1}`,
    },
    userProgress: [],
  }));
};

const createAttachments = (courseId: string, names: string[]): Attachment[] => {
  return names.map((name, index) => ({
    id: `${courseId}-att-${index + 1}`,
    name,
    url: `/attachments/${name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
    courseId,
    createdAt: createDate(25),
    updatedAt: createDate(25),
  }));
};

const seedCourses: CourseWithMeta[] = [
  {
    id: "course-1",
    userId: "instructor-1",
    title: "Blockchain Fundamentals: From Zero to Hero",
    description: "Master the core concepts of blockchain technology. Learn how distributed ledgers work, understand consensus mechanisms, and explore the technology powering cryptocurrencies.",
    imageUrl: "/images/courses/blockchain-fundamentals.jpg",
    price: 49.99,
    isPublished: true,
    categoryId: "cat-1",
    category: categories[0],
    createdAt: createDate(60),
    updatedAt: createDate(5),
    difficulty: "Beginner",
    duration: "6 hours",
    enrolledCount: 1234,
    rating: 4.8,
    instructor: { name: "Alex Chen", imageUrl: "/images/instructors/alex.jpg" },
    chapters: createChapters("course-1", [
      "Introduction to Blockchain",
      "How Distributed Ledgers Work",
      "Consensus Mechanisms Explained",
      "Proof of Work vs Proof of Stake",
      "Cryptographic Hash Functions",
      "Public and Private Keys",
      "Building Your First Transaction",
      "Final Assessment",
    ], [0, 1]),
    attachments: createAttachments("course-1", ["Blockchain Cheatsheet", "Glossary of Terms"]),
  },
  {
    id: "course-2",
    userId: "instructor-1",
    title: "Solidity Smart Contract Development",
    description: "Build production-ready smart contracts on Ethereum. From basic syntax to advanced patterns, security best practices, and gas optimization techniques.",
    imageUrl: "/images/courses/solidity-dev.jpg",
    price: 79.99,
    isPublished: true,
    categoryId: "cat-2",
    category: categories[1],
    createdAt: createDate(45),
    updatedAt: createDate(3),
    difficulty: "Intermediate",
    duration: "12 hours",
    enrolledCount: 856,
    rating: 4.9,
    instructor: { name: "Sarah Miller", imageUrl: "/images/instructors/sarah.jpg" },
    chapters: createChapters("course-2", [
      "Setting Up Your Development Environment",
      "Solidity Basics: Variables and Types",
      "Functions and Modifiers",
      "Storage, Memory, and Calldata",
      "Inheritance and Interfaces",
      "Events and Logging",
      "Error Handling",
      "Security Best Practices",
      "Gas Optimization",
      "Testing with Hardhat",
      "Deploying to Mainnet",
      "Final Project: Build a DEX",
    ], [0, 1, 2]),
    attachments: createAttachments("course-2", ["Solidity Syntax Guide", "Security Checklist", "Gas Optimization Tips"]),
  },
  {
    id: "course-3",
    userId: "instructor-2",
    title: "DeFi Deep Dive: Protocols and Strategies",
    description: "Understand decentralized finance from the ground up. Explore AMMs, lending protocols, yield farming, and build your own DeFi strategies.",
    imageUrl: "/images/courses/defi-deep-dive.jpg",
    price: 89.99,
    isPublished: true,
    categoryId: "cat-3",
    category: categories[2],
    createdAt: createDate(30),
    updatedAt: createDate(7),
    difficulty: "Advanced",
    duration: "10 hours",
    enrolledCount: 567,
    rating: 4.7,
    instructor: { name: "Marcus Johnson", imageUrl: "/images/instructors/marcus.jpg" },
    chapters: createChapters("course-3", [
      "Introduction to DeFi",
      "Understanding AMMs",
      "Uniswap Deep Dive",
      "Lending and Borrowing Protocols",
      "Aave Protocol Analysis",
      "Yield Farming Strategies",
      "Impermanent Loss Explained",
      "Flash Loans",
      "Building a Yield Aggregator",
      "Risk Management in DeFi",
    ], [0]),
    attachments: createAttachments("course-3", ["DeFi Protocol Comparison", "Risk Assessment Framework"]),
  },
  {
    id: "course-4",
    userId: "instructor-2",
    title: "NFT Creation and Marketplace Development",
    description: "Learn to create, mint, and trade NFTs. Build your own NFT marketplace with smart contracts and a modern frontend.",
    imageUrl: "/images/courses/nft-creation.jpg",
    price: 69.99,
    isPublished: true,
    categoryId: "cat-4",
    category: categories[3],
    createdAt: createDate(40),
    updatedAt: createDate(10),
    difficulty: "Intermediate",
    duration: "8 hours",
    enrolledCount: 923,
    rating: 4.6,
    instructor: { name: "Emma Davis", imageUrl: "/images/instructors/emma.jpg" },
    chapters: createChapters("course-4", [
      "What are NFTs?",
      "ERC-721 Standard Deep Dive",
      "ERC-1155 Multi-Token Standard",
      "IPFS and Metadata Storage",
      "Creating Your First NFT Collection",
      "Building a Minting Page",
      "Marketplace Smart Contracts",
      "Frontend Integration",
    ], [0, 1]),
    attachments: createAttachments("course-4", ["ERC-721 Template", "Marketplace Contract Template"]),
  },
  {
    id: "course-5",
    userId: "instructor-3",
    title: "Solana Development Bootcamp",
    description: "Build high-performance dApps on Solana. Learn Rust, Anchor framework, and create blazing-fast applications on the Solana blockchain.",
    imageUrl: "/images/courses/solana-bootcamp.jpg",
    price: 99.99,
    isPublished: true,
    categoryId: "cat-7",
    category: categories[6],
    createdAt: createDate(20),
    updatedAt: createDate(2),
    difficulty: "Advanced",
    duration: "15 hours",
    enrolledCount: 445,
    rating: 4.8,
    instructor: { name: "David Park", imageUrl: "/images/instructors/david.jpg" },
    chapters: createChapters("course-5", [
      "Solana Architecture Overview",
      "Setting Up Solana Development",
      "Rust Basics for Solana",
      "Understanding Accounts",
      "Program Derived Addresses",
      "Anchor Framework Introduction",
      "Building with Anchor",
      "Token Program Integration",
      "SPL Tokens and NFTs",
      "Cross-Program Invocations",
      "Testing Solana Programs",
      "Deploying to Devnet and Mainnet",
      "Building a Full dApp",
      "Performance Optimization",
      "Final Project",
    ], [0, 1]),
    attachments: createAttachments("course-5", ["Solana CLI Cheatsheet", "Anchor Reference Guide", "Rust Basics PDF"]),
  },
  {
    id: "course-6",
    userId: "instructor-1",
    title: "Smart Contract Security Auditing",
    description: "Learn to identify and prevent vulnerabilities in smart contracts. Master security patterns, common attack vectors, and auditing methodologies.",
    imageUrl: "/images/courses/security-audit.jpg",
    price: 129.99,
    isPublished: true,
    categoryId: "cat-5",
    category: categories[4],
    createdAt: createDate(15),
    updatedAt: createDate(1),
    difficulty: "Advanced",
    duration: "14 hours",
    enrolledCount: 312,
    rating: 4.9,
    instructor: { name: "Alex Chen", imageUrl: "/images/instructors/alex.jpg" },
    chapters: createChapters("course-6", [
      "Introduction to Smart Contract Security",
      "Common Vulnerability Patterns",
      "Reentrancy Attacks",
      "Integer Overflow and Underflow",
      "Access Control Vulnerabilities",
      "Oracle Manipulation",
      "Flash Loan Attacks",
      "Frontrunning and MEV",
      "Static Analysis Tools",
      "Manual Code Review Techniques",
      "Writing Security Reports",
      "Bug Bounty Hunting",
      "Building Secure Contracts",
      "Capstone: Full Security Audit",
    ], [0, 1, 2]),
    attachments: createAttachments("course-6", ["Vulnerability Checklist", "Audit Report Template", "Tool Comparison Guide"]),
  },
  {
    id: "course-7",
    userId: "instructor-3",
    title: "Crypto Trading Fundamentals",
    description: "Master the basics of cryptocurrency trading. Learn technical analysis, risk management, and develop your trading strategy.",
    imageUrl: "/images/courses/crypto-trading.jpg",
    price: 59.99,
    isPublished: true,
    categoryId: "cat-6",
    category: categories[5],
    createdAt: createDate(50),
    updatedAt: createDate(8),
    difficulty: "Beginner",
    duration: "5 hours",
    enrolledCount: 2156,
    rating: 4.5,
    instructor: { name: "Jennifer Lee", imageUrl: "/images/instructors/jennifer.jpg" },
    chapters: createChapters("course-7", [
      "Introduction to Crypto Markets",
      "Reading Price Charts",
      "Support and Resistance",
      "Technical Indicators",
      "Risk Management Basics",
      "Building a Trading Plan",
      "Psychology of Trading",
    ], [0, 1]),
    attachments: createAttachments("course-7", ["Trading Journal Template", "Indicator Cheatsheet"]),
  },
  {
    id: "course-8",
    userId: "instructor-2",
    title: "Layer 2 Scaling Solutions",
    description: "Explore Ethereum scaling solutions. Learn about rollups, sidechains, and build applications on Layer 2 networks.",
    imageUrl: "/images/courses/layer2-scaling.jpg",
    price: 74.99,
    isPublished: true,
    categoryId: "cat-8",
    category: categories[7],
    createdAt: createDate(25),
    updatedAt: createDate(4),
    difficulty: "Intermediate",
    duration: "7 hours",
    enrolledCount: 389,
    rating: 4.7,
    instructor: { name: "Marcus Johnson", imageUrl: "/images/instructors/marcus.jpg" },
    chapters: createChapters("course-8", [
      "Why Layer 2 Matters",
      "Optimistic Rollups Explained",
      "ZK Rollups Deep Dive",
      "Arbitrum Development",
      "Optimism Development",
      "Bridging Assets",
      "Building Cross-Chain Applications",
    ], [0]),
    attachments: createAttachments("course-8", ["L2 Comparison Chart", "Bridge Security Guide"]),
  },
];

const initData = () => {
  if (typeof window !== "undefined" && !isStorageInitialized()) {
    initializeStorage(seedCourses, categories, seedProgress, seedPurchases, seedCertificates);
  }
};

const getCourses = (): CourseWithMeta[] => {
  if (typeof window === "undefined") return seedCourses;
  initData();
  const stored = getStoredCourses();
  return stored.length > 0 ? stored : seedCourses;
};

const saveCourses = (courses: CourseWithMeta[]) => {
  if (typeof window !== "undefined") {
    saveStoredCourses(courses);
  }
};

export { seedCourses as courses };

export const getCourseById = (id: string): CourseWithMeta | undefined => {
  return getCourses().find((course) => course.id === id);
};

export const getCoursesByCategory = (categoryId: string): CourseWithMeta[] => {
  return getCourses().filter((course) => course.categoryId === categoryId);
};

export const getPublishedCourses = (): CourseWithMeta[] => {
  return getCourses().filter((course) => course.isPublished);
};

export const searchCourses = (query: string): CourseWithMeta[] => {
  const lowercaseQuery = query.toLowerCase();
  return getCourses().filter(
    (course) =>
      course.title.toLowerCase().includes(lowercaseQuery) ||
      course.description?.toLowerCase().includes(lowercaseQuery)
  );
};

export const filterCourses = (filters: {
  categoryId?: string;
  difficulty?: Difficulty;
  search?: string;
}): CourseWithMeta[] => {
  return getCourses().filter((course) => {
    if (!course.isPublished) return false;
    if (filters.categoryId && course.categoryId !== filters.categoryId) return false;
    if (filters.difficulty && course.difficulty !== filters.difficulty) return false;
    if (filters.search) {
      const query = filters.search.toLowerCase();
      if (!course.title.toLowerCase().includes(query) && !course.description?.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });
};

export const createCourse = (userId: string, title: string): CourseWithMeta => {
  const courses = getCourses();
  const id = `course-${Date.now()}`;
  const newCourse: CourseWithMeta = {
    id,
    userId,
    title,
    description: null,
    imageUrl: null,
    price: null,
    isPublished: false,
    categoryId: null,
    category: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    difficulty: "Beginner",
    duration: "0 hours",
    enrolledCount: 0,
    rating: 0,
    instructor: { name: "You", imageUrl: "/images/avatars/default.jpg" },
    chapters: [],
    attachments: [],
  };
  courses.push(newCourse);
  saveCourses(courses);
  return newCourse;
};

export const updateCourse = (courseId: string, values: Record<string, any>): CourseWithMeta | null => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;

  Object.assign(course, values);
  if (values.categoryId) {
    course.category = categories.find((c) => c.id === values.categoryId) || null;
  }
  course.updatedAt = new Date();
  saveCourses(courses);
  return course;
};

export const deleteCourse = (courseId: string): boolean => {
  const courses = getCourses();
  const index = courses.findIndex((c) => c.id === courseId);
  if (index === -1) return false;
  courses.splice(index, 1);
  saveCourses(courses);
  return true;
};

export const publishCourse = (courseId: string): { success: boolean; error?: string } => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return { success: false, error: "Not found" };

  const hasPublishedChapter = course.chapters?.some((ch) => ch.isPublished);
  if (!course.title || !course.description || !course.imageUrl || !course.categoryId || !hasPublishedChapter) {
    return { success: false, error: "Missing required fields" };
  }

  course.isPublished = true;
  course.updatedAt = new Date();
  saveCourses(courses);
  return { success: true };
};

export const unpublishCourse = (courseId: string): boolean => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return false;
  course.isPublished = false;
  course.updatedAt = new Date();
  saveCourses(courses);
  return true;
};

export const addChapter = (courseId: string, title: string): Chapter | null => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;

  const lastChapter = course.chapters?.length ? course.chapters[course.chapters.length - 1] : null;
  const newPosition = lastChapter ? lastChapter.position + 1 : 1;

  const chapter: Chapter = {
    id: `${courseId}-ch-${Date.now()}`,
    title,
    description: null,
    videoUrl: null,
    position: newPosition,
    isPublished: false,
    isFree: false,
    courseId,
    createdAt: new Date(),
    updatedAt: new Date(),
    muxData: null,
    userProgress: [],
  };

  if (!course.chapters) course.chapters = [];
  course.chapters.push(chapter);
  saveCourses(courses);
  return chapter;
};

export const updateChapter = (courseId: string, chapterId: string, values: Record<string, any>): Chapter | null => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course?.chapters) return null;

  const chapter = course.chapters.find((ch) => ch.id === chapterId);
  if (!chapter) return null;

  const { isPublished, ...rest } = values;
  Object.assign(chapter, rest);

  if (values.videoUrl) {
    chapter.muxData = {
      id: `mux-${chapterId}`,
      assetId: `asset-${chapterId}`,
      playbackId: `playback-${chapterId}`,
      chapterId,
    };
  }

  chapter.updatedAt = new Date();
  saveCourses(courses);
  return chapter;
};

export const deleteChapter = (courseId: string, chapterId: string): boolean => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course?.chapters) return false;

  const index = course.chapters.findIndex((ch) => ch.id === chapterId);
  if (index === -1) return false;

  course.chapters.splice(index, 1);

  const hasPublishedChapter = course.chapters.some((ch) => ch.isPublished);
  if (!hasPublishedChapter) {
    course.isPublished = false;
  }

  saveCourses(courses);
  return true;
};

export const publishChapter = (courseId: string, chapterId: string): { success: boolean; error?: string } => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course?.chapters) return { success: false, error: "Not found" };

  const chapter = course.chapters.find((ch) => ch.id === chapterId);
  if (!chapter) return { success: false, error: "Not found" };

  if (!chapter.title || !chapter.description || !chapter.videoUrl) {
    return { success: false, error: "Missing required fields" };
  }

  chapter.isPublished = true;
  chapter.updatedAt = new Date();
  saveCourses(courses);
  return { success: true };
};

export const unpublishChapter = (courseId: string, chapterId: string): boolean => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course?.chapters) return false;

  const chapter = course.chapters.find((ch) => ch.id === chapterId);
  if (!chapter) return false;

  chapter.isPublished = false;
  chapter.updatedAt = new Date();

  const hasPublishedChapter = course.chapters.some((ch) => ch.isPublished);
  if (!hasPublishedChapter) {
    course.isPublished = false;
  }

  saveCourses(courses);
  return true;
};

export const reorderChapters = (courseId: string, updateData: { id: string; position: number }[]): boolean => {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course?.chapters) return false;

  for (const item of updateData) {
    const chapter = course.chapters.find((ch) => ch.id === item.id);
    if (chapter) chapter.position = item.position;
  }

  course.chapters.sort((a, b) => a.position - b.position);
  saveCourses(courses);
  return true;
};
