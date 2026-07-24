"use client";

import { ChangeEvent, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineCamera } from "react-icons/ai";
import { CiEdit } from "react-icons/ci";
import {
  useEditLayoutMutation,
  useGetHeroDataQuery,
} from "../../../../redux/features/layout/layoutApi";
import { styles } from "../../../styles/styles";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import Loader from "../../Loader/Loader";
import Image from "next/image";

export interface IBanner {
  title?: string;
  subTitle?: string;
  image?: {
    url?: string;
  };
}

interface EditHeroPresenterProps {
  isLoading: boolean;
  isSaving: boolean;
  title: string;
  setTitle: (val: string) => void;
  subTitle: string;
  setSubTitle: (val: string) => void;
  image: string;
  handleUpdate: (e: ChangeEvent<HTMLInputElement>) => void;
  handleEdit: () => Promise<void>;
  isModified: boolean;
}

// ---------------------------------------------------------
// Presenter Component: Pure UI Rendering
// ---------------------------------------------------------
export const EditHeroPresenter = ({
  isLoading,
  isSaving,
  title,
  setTitle,
  subTitle,
  setSubTitle,
  image,
  handleUpdate,
  handleEdit,
  isModified,
}: EditHeroPresenterProps) => {
  if (isLoading || isSaving) {
    return <Loader />;
  }

  return (
    <div className="w-full 1000px:flex items-center">
      {/* Profile Background Circle */}
      <div className="absolute top-25 1000px:top-auto 1500px:h-150 1500px:w-150 1100px:h-125 1100px:w-125 h-[50vh] w-[50vh] hero_animation rounded-full 1100px:left-72 1500px:left-84">
        {!image && (
          <label htmlFor="banner" className="absolute top-24 right-24 z-20">
            <CiEdit className="dark:text-white text-black text-[24px] cursor-pointer" />
          </label>
        )}
      </div>

      {/* Left Portion - Image Upload */}
      <div className="1000px:w-[40%] flex 1000px:min-h-screen items-center justify-end pt-17.5 1000px:pt-0 z-10">
        <div className="relative flex items-center justify-end min-h-75 w-full">
          {image ? (
            /* Using native img to bypass Next Image framework wrapper sizing issues */
            <Image
              src={image}
              alt="Banner"
              fill
              priority
              unoptimized // Prevents Next.js optimization errors on local base64/blob image previews
              className="object-contain pointer-events-none z-10"
            />
          ) : null}
          <input
            type="file"
            id="banner"
            accept="image/*"
            onChange={handleUpdate}
            className="hidden"
          />
          <label htmlFor="banner" className="absolute bottom-0 right-2 z-20">
            <AiOutlineCamera className="dark:text-white text-black text-[18px] cursor-pointer" />
          </label>
        </div>
      </div>

      {/* Right Portion - Content Form */}
      <div className="1000px:w-[60%] flex flex-col items-center 1000px:mt-0 text-center 1000px:text-left mt-37.5">
        <textarea
          className="dark:text-white resize-none text-[#000000c7] text-[30px] px-3 w-full 1000px:text-[60px] 1500px:text-[70px] font-semibold font-Josefin py-2 1000px:leading-18.75 1500px:w-[60%] 1100px:w-[78%] outline-none bg-transparent block"
          placeholder="Improve Your Online Learning Experience Better Instantly"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={4}
        />
        <br />
        <textarea
          className="dark:text-[#edfff4] text-[#000000ac] font-Josefin font-semibold text-[18px] 1500px:w-[55%]! 1100px:w-[74%]! bg-transparent outline-none resize-none"
          placeholder="Learn from the best instructors and take your skills to the next level."
          value={subTitle}
          onChange={(e) => setSubTitle(e.target.value)}
          rows={4}
        />
        <br />
        <br />
        <br />
        <button
          type="button"
          disabled={!isModified}
          onClick={handleEdit}
          className={`${
            styles.button
          } w-25! min-h-10! h-10! dark:text-white text-black bg-[#cccccc34] ${
            isModified ? "cursor-pointer! bg-[#42d383]!" : "cursor-not-allowed!"
          } rounded! absolute bottom-12 right-12`}
        >
          Save
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// Form Component: Handles local input state & modifications
// ---------------------------------------------------------
interface EditHeroFormProps {
  initialBanner?: IBanner;
  isLoading: boolean;
  refetch: () => void;
}

const EditHeroForm = ({
  initialBanner,
  isLoading,
  refetch,
}: EditHeroFormProps) => {
  const [editLayout, { isLoading: isSaving }] = useEditLayoutMutation();

  const [title, setTitle] = useState<string>(initialBanner?.title || "");
  const [subTitle, setSubTitle] = useState<string>(
    initialBanner?.subTitle || "",
  );
  const [image, setImage] = useState<string>(initialBanner?.image?.url || "");

  const isModified =
    (initialBanner?.title || "") !== title ||
    (initialBanner?.subTitle || "") !== subTitle ||
    (initialBanner?.image?.url || "") !== image;

  const handleUpdate = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2 && typeof reader.result === "string") {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!isModified) return;

    try {
      await editLayout({
        type: "Banner",
        title,
        subTitle,
        image,
      }).unwrap();

      toast.success("Hero section updated successfully!");
      refetch();
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Could not update the hero section. Please try again.",
        ),
      );
    }
  };

  return (
    <EditHeroPresenter
      isLoading={isLoading}
      isSaving={isSaving}
      title={title}
      setTitle={setTitle}
      subTitle={subTitle}
      setSubTitle={setSubTitle}
      image={image}
      handleUpdate={handleUpdate}
      handleEdit={handleEdit}
      isModified={isModified}
    />
  );
};

// ---------------------------------------------------------
// Container Component: Query Execution & Key-based Initialization
// ---------------------------------------------------------
const EditHero = () => {
  const { data, isLoading, refetch } = useGetHeroDataQuery("Banner", {
    refetchOnMountOrArgChange: true,
  });

  const banner = data?.layout?.banner;
  const key = banner?.image?.url ?? "loading";

  return (
    <EditHeroForm
      key={key}
      initialBanner={banner}
      isLoading={isLoading}
      refetch={refetch}
    />
  );
};

export default EditHero;
