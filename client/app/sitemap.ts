import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL;

interface IPublicCourse {
  _id: string;
  updatedAt?: string;
  createdAt?: string;
}

async function getCourseEntries(): Promise<MetadataRoute.Sitemap> {
  if (!apiUrl) return [];

  try {
    const res = await fetch(`${apiUrl}/course/all`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const courses: IPublicCourse[] = data?.courses ?? [];

    return courses.map((course) => ({
      url: `${siteUrl}/course/${course._id}`,
      lastModified: course.updatedAt || course.createdAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Sitemap generation must never fail the build — fall back to static
    // routes only if the course API is unreachable.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const courseRoutes = await getCourseEntries();

  return [...staticRoutes, ...courseRoutes];
}