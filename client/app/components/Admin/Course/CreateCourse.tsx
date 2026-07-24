"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCreateCourseMutation } from "../../../../redux/features/courses/courseApi";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import CourseContent from "./CourseContent";

export interface ICourseContentLink {
  title: string;
  url: string;
}

export interface ICourseContentItem {
  videoUrl: string;
  title: string;
  description: string;
  videoLength: string | number;
  videoSection: string;
  links: ICourseContentLink[];
  suggestion?: string;
}

import CourseDataComponent from "./CourseData";
import CourseInformation, { CourseInfo } from "./CourseInformation";
import CourseOptions from "./CourseOptions";
import CoursePreview, { CourseData } from "./CoursePreview";

const CreateCourse = () => {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [createCourse, { isSuccess, isLoading, error }] =
    useCreateCourseMutation();

  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    name: "",
    description: "",
    price: "",
    estimatedPrice: "",
    categories: "",
    tags: "",
    level: "",
    demoUrl: "",
    thumbnail: "",
  });

  const [benefits, setBenefits] = useState<{ title: string }[]>([
    { title: "" },
  ]);
  const [prerequisites, setPrerequisites] = useState<{ title: string }[]>([
    { title: "" },
  ]);

  const [courseContentData, setCourseContentData] = useState<
    ICourseContentItem[]
  >([
    {
      videoUrl: "",
      title: "",
      description: "",
      videoLength: "",
      videoSection: "untitled Section",
      links: [
        {
          title: "",
          url: "",
        },
      ],
      suggestion: "",
    },
  ]);

  const [courseData, setCourseData] = useState<CourseData | null>(null);

  // Handling success and error notifications
  useEffect(() => {
    if (isSuccess) {
      toast.success("Course Created Successfully!");
      router.push("/admin/courses");
    }
    if (error) {
      toast.error(
        getErrorMessage(
          error,
          "Could not create the course. Please try again."
        )
      );
    }
  }, [isSuccess, error, router]);

  // Formatting all course input data into Object
  const handleSubmit = async () => {
    // Format benefits array
    const formattedBenefits = benefits.map((benefit) => ({
      title: benefit.title,
    }));

    // Format prerequisites array
    const formattedPrerequisites = prerequisites.map((prerequisite) => ({
      title: prerequisite.title,
    }));

    // Format course content array
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

    // Prepare data object conforming to CourseData type
    const data: CourseData = {
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

    setCourseData(data);
  };

  // Submits the course data to the API
  const handleCourseCreate = async () => {
    if (!isLoading && courseData) {
      await createCourse(courseData);
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
            setActive={setActive}
          />
        )}
      </div>
      <div className="w-[20%] mt-25 h-screen fixed z-1 top-18 right-0 p-4">
        <CourseOptions active={active} setActive={setActive} />
      </div>
    </div>
  );
};

export default CreateCourse;