"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineDelete } from "react-icons/ai";
import { IoMdAddCircleOutline } from "react-icons/io";
import { styles } from "../../../../app/styles/styles";
import {
  useEditLayoutMutation,
  useGetHeroDataQuery,
} from "../../../../redux/features/layout/layoutApi";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import Loader from "../../Loader/Loader";

export interface ICategoryItem {
  _id?: string;
  title: string;
}

interface EditCategoriesFormProps {
  initialCategories: ICategoryItem[];
  refetch: () => void;
}

// ---------------------------------------------------------
// Form Component: Manages local categories state & actions
// ---------------------------------------------------------
const EditCategoriesForm = ({
  initialCategories,
  refetch,
}: EditCategoriesFormProps) => {
  const [categories, setCategories] =
    useState<ICategoryItem[]>(initialCategories);

  const [editLayout, { isLoading, isSuccess: layoutSuccess, error }] =
    useEditLayoutMutation();

  useEffect(() => {
    if (layoutSuccess) {
      refetch();
      toast.success("Categories Updated Successfully!");
    }
    if (error) {
      toast.error(
        getErrorMessage(error, "Could not update categories. Please try again.")
      );
    }
  }, [layoutSuccess, error, refetch]);

  const handleCategoriesAdd = (id: string | undefined, value: string) => {
    setCategories((prevCategory) =>
      prevCategory.map((i) => (i._id === id ? { ...i, title: value } : i))
    );
  };

  const newCategoriesHandler = () => {
    if (
      categories.length > 0 &&
      categories[categories.length - 1].title.trim() === ""
    ) {
      toast.error("Category Title cannot be Empty!");
    } else {
      setCategories((prevCategories) => [
        ...prevCategories,
        { _id: `temp-${Date.now()}`, title: "" },
      ]);
    }
  };

  const areCategoriesUnchanged = (
    original: ICategoryItem[],
    current: ICategoryItem[]
  ) => {
    if (!original || !current) return true;
    return JSON.stringify(original) === JSON.stringify(current);
  };

  const isAnyCategoryTitleEmpty = (cats: ICategoryItem[]) => {
    return cats.some((cat) => cat.title.trim() === "");
  };

  const isDisabled =
    areCategoriesUnchanged(initialCategories, categories) ||
    isAnyCategoryTitleEmpty(categories);

  const editCategoriesHandler = async () => {
    if (!isDisabled) {
      // Strip temporary IDs so Mongoose auto-generates valid ObjectIds on new documents
      const sanitizedCategories = categories.map(({ _id, title }) => {
        const isRealObjectId = _id && /^[0-9a-fA-F]{24}$/.test(_id);
        return {
          ...(isRealObjectId ? { _id } : {}),
          title,
        };
      });

      await editLayout({
        type: "Categories",
        categories: sanitizedCategories,
      });
    }
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="mt-30 text-center">
          <h1 className={`${styles.title}`}>All Categories</h1>
          {categories.map((item, index) => {
            return (
              <div className="p-3" key={item._id ?? index}>
                <div className="flex items-center w-full justify-center">
                  <input
                    className={`${styles.input} w-[unset]! border-none! text-[20px]!`}
                    value={item.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCategoriesAdd(item._id, e.target.value)
                    }
                    placeholder="Enter category title..."
                  />
                  <AiOutlineDelete
                    className="dark:text-white text-black text-[18px] cursor-pointer"
                    onClick={() => {
                      setCategories((prevCategory) =>
                        prevCategory.filter((i) => i._id !== item._id)
                      );
                    }}
                  />
                </div>
              </div>
            );
          })}

          <br />
          <br />
          <div className="w-full flex justify-center">
            <IoMdAddCircleOutline
              className="dark:text-white text-black text-[25px] cursor-pointer"
              onClick={newCategoriesHandler}
            />
          </div>
          <button
            type="button"
            disabled={isDisabled}
            onClick={editCategoriesHandler}
            className={`${
              styles.button
            } w-25! min-h-10! h-10! dark:text-white text-black bg-[#cccccc34] ${
              isDisabled
                ? "cursor-not-allowed!"
                : "cursor-pointer! bg-[#42d383]!"
            } rounded! absolute bottom-12 right-12`}
          >
            Save
          </button>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------
// Wrapper Component: Fetches Data & Controls Re-render Keys
// ---------------------------------------------------------
const EditCategories = () => {
  const { data, isLoading, refetch } = useGetHeroDataQuery("Categories", {
    refetchOnMountOrArgChange: true,
  });

  if (isLoading) {
    return <Loader />;
  }

  const categoryData: ICategoryItem[] = data?.layout?.categories || [];
  const key = categoryData.map((c) => c._id).join("-") || "empty";

  return (
    <EditCategoriesForm
      key={key}
      initialCategories={categoryData}
      refetch={refetch}
    />
  );
};

export default EditCategories;