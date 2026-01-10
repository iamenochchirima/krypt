import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Play } from "lucide-react"

// Mock course data
const courses = [
  {
    id: "1",
    title: "Introduction to Blockchain",
    description: "Learn the fundamentals of blockchain technology and its applications.",
    difficulty: "Beginner",
    chain: "Multi-chain",
    duration: "4 hours",
    image: "/placeholder.svg?height=400&width=800&query=blockchain introduction course",
    modules: [
      {
        id: 1,
        title: "What is Blockchain?",
        duration: "30 min",
        completed: true,
      },
      {
        id: 2,
        title: "Consensus Mechanisms",
        duration: "45 min",
        completed: true,
      },
      {
        id: 3,
        title: "Cryptography Basics",
        duration: "1 hour",
        completed: false,
      },
      {
        id: 4,
        title: "Blockchain Use Cases",
        duration: "45 min",
        completed: false,
      },
      {
        id: 5,
        title: "Final Assessment",
        duration: "1 hour",
        completed: false,
      },
    ],
  },
  // Add more courses as needed
]

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = courses.find((c) => c.id === params.id) || courses[0]
  const completedModules = course.modules.filter((m) => m.completed).length
  const progress = (completedModules / course.modules.length) * 100

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8">
        <Link href="/learn" className="text-primary hover:underline">
          ← Back to Courses
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="order-2 lg:order-1 lg:col-span-1">
          <div className="sticky top-24 rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Course Modules</h2>
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="space-y-4">
              {course.modules.map((module) => (
                <div
                  key={module.id}
                  className={`flex items-center rounded-lg border p-3 ${
                    module.completed ? "border-primary/50 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="mr-3">
                    {module.completed ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground text-xs">
                        {module.id}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{module.title}</h3>
                    <p className="text-xs text-muted-foreground">{module.duration}</p>
                  </div>
                  <Button size="sm" variant={module.completed ? "outline" : "default"}>
                    {module.completed ? "Review" : "Start"}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button className="w-full" disabled={progress < 100}>
                {progress < 100 ? "Complete All Modules" : "Claim Certificate"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="order-1 lg:order-2 lg:col-span-2">
          <div className="mb-6">
            <h1 className="mb-4 text-3xl font-bold">{course.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {course.difficulty}
              </span>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {course.chain}
              </span>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {course.duration}
              </span>
            </div>
            <p className="text-lg text-muted-foreground">{course.description}</p>
          </div>

          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg">
            <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Button size="lg" className="rounded-full">
                <Play className="mr-2 h-5 w-5" /> Watch Introduction
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-2xl font-bold">Course Overview</h2>
              <p className="text-muted-foreground">
                This course provides a comprehensive introduction to blockchain technology. You'll learn about the
                fundamental concepts, consensus mechanisms, cryptography basics, and real-world applications of
                blockchain. By the end of this course, you'll have a solid understanding of how blockchain works and its
                potential impact across various industries.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-bold">What You'll Learn</h2>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Understand the core concepts of blockchain technology</li>
                <li>Learn about different consensus mechanisms (PoW, PoS, etc.)</li>
                <li>Grasp the basics of cryptography used in blockchain systems</li>
                <li>Explore real-world applications and use cases of blockchain</li>
                <li>Analyze the advantages and limitations of blockchain technology</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-bold">Requirements</h2>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>No prior blockchain knowledge required</li>
                <li>Basic understanding of computer science concepts</li>
                <li>Curiosity and willingness to learn</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
