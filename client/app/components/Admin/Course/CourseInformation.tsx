import { useEffect } from "react";
import { useGetHeroDataQuery } from "../../../../redux/features/layout/layoutApi";
import { styles } from "../../../styles/styles";
import Image from "next/image";
import React, { useState, useMemo } from "react";

export interface Category {
  _id: string;
  title: string;
}

export interface CourseInfo {
  name: string;
  description: string;
  price: string | number;
  estimatedPrice: string | number;
  tags: string;
  categories: string;
  level: string;
  demoUrl: string;
  thumbnail: string;
}

type Props = {
  courseInfo: CourseInfo;
  setCourseInfo: React.Dispatch<React.SetStateAction<CourseInfo>>;
  active: number;
  setActive: (active: number) => void;
};

const CourseInformation = ({
  courseInfo,
  setCourseInfo,
  active,
  setActive,
}: Props) => {
  const { data } = useGetHeroDataQuery("Categories", {
    refetchOnMountOrArgChange: true,
  });

  const categories: Category[] = useMemo(() => {
    return data?.layout?.categories || [];
  }, [data]);

  useEffect(() => {
    if (categories.length > 0 && !courseInfo?.categories) {
      setCourseInfo((prev) => ({
        ...prev,
        categories: categories[0]?.title || "",
      }));
    }
  }, [categories, courseInfo?.categories, setCourseInfo]);

  const [dragging, setDragging] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActive(active + 1);
  };

  // Handles image file selection and sets thumbnail preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.readyState === 2 && typeof reader.result === "string") {
          setCourseInfo((prev) => ({
            ...prev,
            thumbnail: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Triggered when file is dragged over drop area
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  // Triggered when drag leaves the drop area
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  // Handles drop event for thumbnail upload
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setCourseInfo((prev) => ({
            ...prev,
            thumbnail: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-[80%] m-auto mt-15 800px:mt-24">
      <form onSubmit={handleSubmit}>
        {/* Course name input */}
        <div>
          <label htmlFor="name" className={`${styles.label}`}>
            Course Name
          </label>
          <input
            type="text"
            required
            value={courseInfo.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCourseInfo({ ...courseInfo, name: e.target.value })
            }
            id="name"
            placeholder="MERN stack LMS platform with next 16"
            className={`${styles.input}`}
          />
        </div>
        <br />

        {/* Course description input */}
        <div className="mb-5">
          <label htmlFor="description" className={`${styles.label}`}>
            Course Description
          </label>
          <textarea
            id="description"
            cols={30}
            rows={8}
            placeholder="Write something amazing..."
            className={`${styles.input} h-min! py-2!`}
            value={courseInfo.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setCourseInfo({ ...courseInfo, description: e.target.value })
            }
          ></textarea>
        </div>
        <br />

        {/* Price and Estimated Price inputs */}
        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label htmlFor="price" className={`${styles.label}`}>
              Course Price
            </label>
            <input
              type="number"
              required
              value={courseInfo.price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCourseInfo({ ...courseInfo, price: e.target.value })
              }
              id="price"
              placeholder="200"
              className={`${styles.input}`}
            />
          </div>

          <div className="w-[50%]">
            <label htmlFor="estimatedPrice" className={`${styles.label}`}>
              Estimated Price
            </label>
            <input
              type="number"
              required
              value={courseInfo.estimatedPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCourseInfo({ ...courseInfo, estimatedPrice: e.target.value })
              }
              id="estimatedPrice"
              placeholder="150"
              className={`${styles.input}`}
            />
          </div>
        </div>
        <br />

        {/* Tags input && Course-Categories */}
        <div className="flex justify-between w-full">
          <div className="w-[46%]">
            <label htmlFor="tags" className={`${styles.label}`}>
              Course Tags
            </label>
            <input
              type="text"
              required
              value={courseInfo.tags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCourseInfo({ ...courseInfo, tags: e.target.value })
              }
              id="tags"
              placeholder="MERN,Next 16,Socket io,tailwind css,LMS"
              className={`${styles.input}`}
            />
          </div>
          <div className="w-[46%]">
            <label htmlFor="categories" className={styles.label}>
              Course Category
            </label>
            <select
              id="categories"
              className={`${styles.input} dark:bg-slate-900 dark:text-white`}
              required
              value={courseInfo.categories}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCourseInfo({ ...courseInfo, categories: e.target.value })
              }
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category: Category) => (
                <option key={category._id} value={category.title}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <br />

        {/* Level and Demo URL inputs */}
        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label htmlFor="level" className={`${styles.label}`}>
              Course Level
            </label>
            <input
              type="text"
              value={courseInfo.level}
              required
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCourseInfo({ ...courseInfo, level: e.target.value })
              }
              id="level"
              placeholder="Beginner/Intermediate/Expert"
              className={`${styles.input}`}
            />
          </div>
          <div className="w-[50%]">
            <label htmlFor="demoUrl" className={`${styles.label}`}>
              Demo Url
            </label>
            <input
              type="text"
              required
              value={courseInfo.demoUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCourseInfo({ ...courseInfo, demoUrl: e.target.value })
              }
              id="demoUrl"
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className={`${styles.input}`}
            />
          </div>
        </div>
        <br />

        {/* Thumbnail upload via file input or drag-and-drop */}
        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            id="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            className={`w-full min-h-[10vh] dark:border-white border-[#00000026] p-3 border flex items-center justify-center ${
              dragging ? "bg-blue-500" : "bg-transparent"
            }`}
            htmlFor="file"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
          >
            {courseInfo.thumbnail ? (
              <Image
                src={courseInfo.thumbnail}
                alt="Course thumbnail"
                width={500}
                height={300}
                className="max-h-full object-cover w-full"
              />
            ) : (
              <span>Drag and Drop Your Thumbnail here or click to Browse</span>
            )}
          </label>
        </div>
        <br />

        {/* Submit button to go to next step */}
        <div className="w-full flex items-center justify-end">
          <input
            type="submit"
            value="Next"
            className="w-full 800px:w-45 h-10 bg-[#37a39a] text-center text-white rounded mt-8 cursor-pointer"
          />
        </div>

        <br />
        <br />
      </form>
    </div>
  );
};

export default CourseInformation;
