import type { Metadata } from "next";
import HomeContent from "./components/Route/HomeContent";

const title = "LMS - Learn from the best";
const description =
  "Learn from the best instructors and experts in the industry. Join our LMS platform to access high-quality courses and enhance your skills.";
const previewImage = "/assets/hero-banner-1.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "LMS",
    "online learning",
    "courses",
    "education",
    "skills",
    "instructors",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/",
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

const Page = () => {
  return <HomeContent />;
};

export default Page;