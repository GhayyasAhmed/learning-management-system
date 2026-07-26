"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
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

const Page = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

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
          <CourseContent id={id} user={user} />
          <Footer />
        </div>
      )}
    </>
  );
};

export default Page;