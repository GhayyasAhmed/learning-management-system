import React from "react";
import { useGetUsersAllCoursesQuery } from "../../../redux/features/courses/courseApi";
import CourseCard from "../Courses/CourseCard";
import Loader from "../Loader/Loader";

export interface ICourse {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  estimatedPrice?: number;
  thumbnail?: {
    public_id?: string;
    url: string;
  };
  tags?: string;
  level?: string;
  ratings?: number;
  purchased?: number;
}

const Courses = () => {
  const { data, isLoading } = useGetUsersAllCoursesQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );

  // Derived directly from RTK Query cache to prevent cascading re-renders
  const courses: ICourse[] = data?.courses ?? [];

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div>
          <div className="w-[90%] 800px:w-[80%] m-auto">
            <h1 className="text-center font-Poppins text-[25px] leading-8.75 sm:text-3xl lg:text-4xl dark:text-white 800px:leading-15! text-black font-bold tracking-tight">
              Expand Your Career <span className="text-gradient">Opportunity</span>
              <br />
              Opportunity With Our Courses
            </h1>
            <br />
            <br />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-3 lg:gap-6.25 1500px:grid-cols-4 1500px:gap-8.75 mb-12 border-0">
              {courses.map((item: ICourse) => (
                <CourseCard item={item} key={item._id} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Courses;