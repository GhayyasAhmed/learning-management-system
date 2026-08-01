import type { Metadata } from "next";
import CourseDetailsPage from "../../components/Courses/CourseDetailsPage";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

interface ISeoCourse {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  ratings?: number;
  purchased?: number;
  thumbnail?: { url?: string } | string;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL;
const fallbackImage = "/assets/hero-banner-1.png";

// Server-side fetch of the public, sanitized course document (same endpoint
// CourseDetailsPage uses client-side) purely for metadata/structured-data
// generation, so title/description/canonical/JSON-LD are present in the
// initial HTML regardless of client-side loading state.
async function getCourseForSeo(id: string): Promise<ISeoCourse | null> {
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/course/get/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.course ?? null;
  } catch {
    return null;
  }
}

const getThumbnailUrl = (thumbnail: ISeoCourse["thumbnail"]) =>
  (typeof thumbnail === "string" ? thumbnail : thumbnail?.url) || undefined;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseForSeo(id);
  const canonicalPath = `/course/${id}`;

  const title = course?.name || "Course";
  const description =
    (course?.description && course.description.slice(0, 155)) ||
    "Explore this course on Elearing — a platform for students to learn and get help from teachers.";
  const image = getThumbnailUrl(course?.thumbnail) || fallbackImage;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const course = await getCourseForSeo(id);

  const courseJsonLd = course
    ? {
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.name,
        description: course.description || course.name,
        provider: {
          "@type": "Organization",
          name: "Elearing",
          sameAs: siteUrl,
        },
        image: getThumbnailUrl(course.thumbnail) || `${siteUrl}${fallbackImage}`,
        ...(typeof course.ratings === "number" && course.ratings > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: course.ratings,
                ratingCount:
                  course.purchased && course.purchased > 0
                    ? course.purchased
                    : 1,
              },
            }
          : {}),
        offers: {
          "@type": "Offer",
          price: course.price ?? 0,
          priceCurrency: "USD",
          url: `${siteUrl}/course/${id}`,
          availability: "https://schema.org/InStock",
        },
      }
    : null;

  const breadcrumbJsonLd = course
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Courses",
            item: `${siteUrl}/courses`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: course.name,
            item: `${siteUrl}/course/${id}`,
          },
        ],
      }
    : null;

  return (
    <div>
      {courseJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(courseJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <CourseDetailsPage id={id} />
    </div>
  );
};

export default Page;