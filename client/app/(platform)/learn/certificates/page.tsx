"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2, ExternalLink } from "lucide-react";
import { getUserCertificates, mockUser } from "@/data/learn";

export default function CertificatesPage() {
  const certificates = getUserCertificates(mockUser.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground">
          View and share your earned certificates.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Award className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No certificates yet</h3>
          <p className="mb-6 max-w-md text-muted-foreground">
            Complete courses to earn certificates that showcase your skills and knowledge.
          </p>
          <Button asChild>
            <Link href="/learn">Browse Courses</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="crypto-card">
              <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-background">
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <Award className="mb-3 h-12 w-12 text-primary" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Certificate of Completion
                  </p>
                  <h3 className="mt-2 text-lg font-bold">{certificate.courseName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Issued to {mockUser.name}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(certificate.issueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Certificate ID</span>
                  <span className="font-mono text-xs">{certificate.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span>
                    {new Date(certificate.completionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                <Link href={`/learn/${certificate.courseId}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Course
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-xl border bg-card p-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold">Earn More Certificates</h2>
          <p className="mb-6 text-muted-foreground">
            Complete courses to earn verifiable certificates that you can share with employers
            and add to your professional profile.
          </p>
          <Button asChild>
            <Link href="/learn">Explore Courses</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
