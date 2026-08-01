import type { Metadata } from "next";

const title = "All Courses";
const description =
  "Browse the full ELearning course catalog — filter by category and find the right course to build your programming skills.";
const previewImage = "/assets/hero-banner-1.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title,
    description,
    url: "/courses",
    type: "website",
    images: [
      { url: previewImage, width: 1200, height: 630, alt: title },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [previewImage],
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}