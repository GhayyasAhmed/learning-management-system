"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useSelector } from "react-redux";
import CourseContent from "../../components/Courses/CourseContent";
import { IRootUser, IUserCourse } from "../../components/Courses/CourseDetails";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader/Loader";

interface RootState {
  auth: {
    user: IRootUser | null;
  };
}

const tabParamToIndex = (tab: string | null | undefined): number | undefined => {
  switch (tab) {
    case "qa":
      return 2;
    case "reviews":
      return 3;
    case "resources":
      return 1;
    case "overview":
      return 0;
    default:
      return undefined;
  }
};

const PageContent = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);

  const initialTab = tabParamToIndex(searchParams?.get("tab"));
  const initialContentId = searchParams?.get("contentId") || undefined;

  useEffect(() => {
    if (!user || !user?._id) {
      router.replace("/");
      return;
    }
    const isAdmin = user?.role === "admin";
    const isPurchased = user?.courses?.find((item: IUserCourse) => {
      const courseId = item?.courseId ?? item?._id ?? item;
      return courseId?.toString?.() === id?.toString?.();
    });
    if (!isPurchased && !isAdmin) {
      router.replace("/");
    }
  }, [user, id, router]);

  return (
    <>
      {!user ? (
        <Loader />
      ) : (
        <div>
          <CourseContent
            id={id}
            user={user}
            initialTab={initialTab}
            initialContentId={initialContentId}
          />
          <Footer />
        </div>
      )}
    </>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<Loader />}>
      <PageContent />
    </Suspense>
  );
};

export default Page;