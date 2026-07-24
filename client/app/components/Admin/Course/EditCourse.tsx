"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useEditCourseMutation,
  useGetAllCourseQuery,
} from "../../../../redux/features/courses/courseApi";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import CourseContent, { ICourseContentItem } from "./CourseContent";
import CourseDataComponent from "./CourseData";
import CourseInformation, { CourseInfo } from "./CourseInformation";
import CourseOptions from "./CourseOptions";
import CoursePreview, { CourseData } from "./CoursePreview";

interface ICourse {
  _id: string;
  name: string;
  description: string;
  price: number | string;
  estimatedPrice?: number | string;
  tags: string;
  level: string;
  categories: string;
  demoUrl: string;
  thumbnail?: {
    url?: string;
  };
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  courseData: ICourseContentItem[];
}

type Props = {
  id: string;
};

type CourseFormProps = {
  initialData: ICourse;
  id: string;
};

// ---------------------------------------------------------
// Inner Form Component: State is initialized directly from props
// ---------------------------------------------------------
const EditCourseForm = ({ initialData, id }: CourseFormProps) => {
  const router = useRouter();
  const [active, setActive] = useState(0);

  // Initialize state directly from props (No useEffect state syncing needed)
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    name: initialData.name || "",
    description: initialData.description || "",
    price: initialData.price || "",
    estimatedPrice: initialData.estimatedPrice || "",
    tags: initialData.tags || "",
    level: initialData.level || "",
    categories: initialData.categories || "",
    demoUrl: initialData.demoUrl || "",
    thumbnail: initialData.thumbnail?.url || "",
  });

  const [benefits, setBenefits] = useState<{ title: string }[]>(
    initialData.benefits && initialData.benefits.length > 0
      ? initialData.benefits
      : [{ title: "" }]
  );

  const [prerequisites, setPrerequisites] = useState<{ title: string }[]>(
    initialData.prerequisites && initialData.prerequisites.length > 0
      ? initialData.prerequisites
      : [{ title: "" }]
  );

  const [courseContentData, setCourseContentData] = useState<
    ICourseContentItem[]
  >(initialData.courseData || []);

  const [courseData, setCourseData] = useState<CourseData | null>(null);

  // Edit course mutation hook
  const [editCourse, { isSuccess, isLoading, error }] = useEditCourseMutation();

  // Handle mutation responses
  useEffect(() => {
    if (isSuccess) {
      toast.success("Course updated successfully");
      router.push("/admin/courses");
    }
    if (error) {
      toast.error(
        getErrorMessage(
          error,
          "Failed to update course. Please try again."
        )
      );
    }
  }, [isSuccess, error, router]);

  // Submit handler for course compilation
  const handleSubmit = () => {
    const formattedBenefits = benefits.map((benefit) => ({
      title: benefit.title,
    }));

    const formattedPrerequisites = prerequisites.map((prerequisite) => ({
      title: prerequisite.title,
    }));

    const formattedCourseContentData = courseContentData.map((content) => ({
      videoUrl: content.videoUrl,
      title: content.title,
      description: content.description,
      videoLength: content.videoLength,
      videoSection: content.videoSection,
      links: content.links.map((link) => ({
        title: link.title,
        url: link.url,
      })),
      suggestion: content.suggestion,
    }));

    const payload: CourseData = {
      name: courseInfo.name,
      title: courseInfo.name,
      description: courseInfo.description,
      price: Number(courseInfo.price) || 0,
      estimatedPrice: Number(courseInfo.estimatedPrice) || 0,
      categories: courseInfo.categories,
      tags: courseInfo.tags,
      thumbnail: courseInfo.thumbnail,
      level: courseInfo.level,
      demoUrl: courseInfo.demoUrl,
      benefits: formattedBenefits,
      prerequisites: formattedPrerequisites,
      courseData: formattedCourseContentData,
    };

    setCourseData(payload);
  };

  // Submits the payload to backend
  const handleCourseCreate = async () => {
    if (!isLoading && courseData && id) {
      await editCourse({ id, data: courseData });
    }
  };

  return (
    <div className="w-full flex min-h-screen">
      <div className="w-[80%]">
        {active === 0 && (
          <CourseInformation
            courseInfo={courseInfo}
            setCourseInfo={setCourseInfo}
            active={active}
            setActive={setActive}
          />
        )}
        {active === 1 && (
          <CourseDataComponent
            benefits={benefits}
            setBenefits={setBenefits}
            prequisites={prerequisites}
            setPrerequisites={setPrerequisites}
            active={active}
            setActive={setActive}
          />
        )}
        {active === 2 && (
          <CourseContent
            courseContentData={courseContentData}
            setCourseContentData={setCourseContentData}
            active={active}
            setActive={setActive}
            handleSubmit={handleSubmit}
          />
        )}
        {active === 3 && (
          <CoursePreview
            courseData={courseData || ({} as CourseData)}
            handleCourseCreate={handleCourseCreate}
            active={active}
            isEdit={true}
            setActive={setActive}
          />
        )}
      </div>
      <div className="w-[20%] mt-25 h-screen fixed z-[-1] top-18 right-0 p-4">
        <CourseOptions active={active} setActive={setActive} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// Container Component: Handles Data Fetching & Key Remounting
// ---------------------------------------------------------
const EditCourse = ({ id }: Props) => {
  const { isLoading, data } = useGetAllCourseQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );

  const editCourseData = data?.courses?.find(
    (item: ICourse) => item._id === id
  );

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading course details...</p>
      </div>
    );
  }

  if (!editCourseData) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-500">Course not found.</p>
      </div>
    );
  }

  // Key remounting ensures fresh initial state on data load
  return <EditCourseForm key={editCourseData._id} initialData={editCourseData} id={id} />;
};

export default EditCourse;