"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import Header from "../components/Header";
import Loader from "../components/Loader/Loader";
import Headings from "../utils/Heading";
import { useGetUsersAllCoursesQuery } from "../../redux/features/courses/courseApi";
import { useGetHeroDataQuery } from "../../redux/features/layout/layoutApi";
import { styles } from "../styles/styles";
import CourseCard from "../components/Courses/CourseCard";
import Footer from "../components/Footer";

export interface ICourseItem {
  _id: string;
  name: string;
  categories?: string;
  [key: string]: unknown;
}

export interface ICategoryItem {
  _id?: string;
  title: string;
}

const CoursesContent = () => {
  const searchParams = useSearchParams();
  const searchTerm = searchParams?.get("title");
  const { data, isLoading } = useGetUsersAllCoursesQuery(undefined, {});
  const { data: categories } = useGetHeroDataQuery("Categories", {});
  const [route, setRoute] = useState("Login");
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("All");

  const layoutCategories: ICategoryItem[] = categories?.layout?.categories;

  // Derive filtered courses directly during render instead of storing in useEffect state
  const courses = useMemo<ICourseItem[]>(() => {
    const allCourses: ICourseItem[] = data?.courses ?? data?.course ?? [];

    if (!allCourses.length) {
      return [];
    }

    if (searchTerm) {
      return allCourses.filter((item: ICourseItem) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category === "All") {
      return allCourses;
    }

    return allCourses.filter(
      (item: ICourseItem) =>
        item.categories &&
        item.categories.toLowerCase() === category.toLowerCase()
    );
  }, [category, data, searchTerm]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Header
            route={route}
            setRoute={setRoute}
            open={open}
            setOpen={setOpen}
            activeItem={1}
          />
          <div className="w-[95%] 800px:w-[85%] m-auto min-h-[70vh]">
            <Headings
              title={"All courses - LMS"}
              description={"LMS is a programming community."}
              keywords={
                "programming community, coding skills, expert insights, collaboration, growth"
              }
            />
            <br />
            <div className="w-full flex items-center flex-wrap">
              <div
                className={`h-8.75 ${
                  category === "All" ? "bg-[crimson]" : "bg-[#5050cb]"
                } m-3 px-3 rounded-[30px] flex items-center justify-center font-Poppins cursor-pointer`}
                onClick={() => setCategory("All")}
              >
                All
              </div>
              {layoutCategories &&
                layoutCategories.map((item: ICategoryItem, index: number) => (
                  <div key={index}>
                    <div
                      className={`h-8.75 ${
                        category === item.title
                          ? "bg-[crimson]"
                          : "bg-[#5050cb]"
                      } m-3 px-3 rounded-[30px] flex items-center justify-center font-Poppins cursor-pointer`}
                      onClick={() => setCategory(item.title)}
                    >
                      {item.title}
                    </div>
                  </div>
                ))}
            </div>
            {courses && courses.length === 0 && (
              <p
                className={`${styles.label} justify-center min-h-[50vh] flex items-center`}
              >
                {searchTerm
                  ? "No courses found!"
                  : "No courses found in this category. Please try another one!"}
              </p>
            )}
            <br />
            <br />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-3 lg:gap-6.25 1500px:grid-cols-4 1500px:gap-8.75 mb-12 border-0">
              {!isLoading &&
                courses &&
                courses.map((item: ICourseItem, index: number) => (
                  <CourseCard item={item} key={item._id || index} />
                ))}
            </div>
          </div>
          <Footer />
        </>
      )}
    </>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<Loader />}>
      <CoursesContent />
    </Suspense>
  );
};

export default Page;