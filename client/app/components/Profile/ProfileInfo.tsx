"use client";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineCamera } from "react-icons/ai";
import avatarDefault from "../../../public/assets/avatardefault.jpg";
import { useLoadUserQuery } from "../../../redux/features/api/apiSlice";
import {
    useEditProfileMutation,
    useUpdateAvatarMutation,
} from "../../../redux/features/user/userApi";
import { styles } from "../../styles/styles";
import { getErrorMessage } from "../../utils/getErrorMessage";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ProfileInfoProps = {
  user: any;
  avatar: string | null;
};

const ProfileInfo = ({ user, avatar }: ProfileInfoProps) => {
  const [name, setName] = useState(user?.name || "");
  const [updateAvatar, { isLoading: isAvatarLoading }] = useUpdateAvatarMutation();
  const [editProfile, { isLoading: isEditLoading }] = useEditProfileMutation();
  
  // Directly trigger refetch if needed, or rely on tag invalidation in userApi/apiSlice
  const { refetch } = useLoadUserQuery(undefined);

  const imageHandler = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();

    fileReader.onload = async () => {
      if (fileReader.readyState === 2) {
        try {
          await updateAvatar({ avatar: fileReader.result }).unwrap();
          toast.success("Avatar updated successfully!");
          refetch();
        } catch (err) {
          toast.error(
            getErrorMessage(err, "Could not update avatar. Please try again.")
          );
        }
      }
    };
    fileReader.readAsDataURL(file);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (name !== "") {
      try {
        await editProfile({ name, email: user.email }).unwrap();
        toast.success("Profile updated successfully!");
        refetch();
      } catch (err) {
        toast.error(
          getErrorMessage(err, "Could not update your profile. Please try again.")
        );
      }
    }
  };

  return (
    <>
      <div className="w-full flex justify-center">
        <div className="relative">
          <Image
            src={
              user?.avatar?.url || avatar || avatarDefault
            }
            alt="Profile Photo"
            width={120}
            height={120}
            loading="eager"
            className="w-30 object-cover h-30 cursor-pointer border-[3px] border-[#30bbb2ca] rounded-full"
          />
          <input
            type="file"
            name=""
            id="avatar"
            className="hidden"
            onChange={imageHandler}
            accept="image/png,image/jpg,image/jpeg,image/webp"
          />
          <label htmlFor="avatar">
            <div className="w-7.5 h-7.5 bg-slate-900 rounded-full absolute bottom-2 right-2 flex items-center justify-center cursor-pointer">
              <AiOutlineCamera size={20} className="z-1" />
            </div>
          </label>
        </div>
      </div>
      <br />
      <br />

      <div className="w-full pl-6 800px:pl-10">
        <form onSubmit={handleSubmit}>
          <div className="800px:w-[50%] m-auto block pb-4">
            <div className="w-full dark:text-white text-black pt-2">
              <label className="block" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                className={`${styles.input} w-[95%]! mb-4 800px:mb-0`}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <br />
            <div className="w-full dark:text-white text-black pt-2">
              <label className="block" htmlFor="email">
                Email
              </label>
              <input
                type="text"
                readOnly
                id="email"
                className={`${styles.input} w-[95%]! mb-4 800px:mb-0`}
                required
                value={user?.email || ""}
              />
            </div>
            <br />
            <input
              type="submit"
              disabled={isEditLoading || isAvatarLoading}
              className={`w-full 800px:w-62.5 h-10 border border-[cyan] text-center dark:text-white text-black rounded-[3px] mt-8 cursor-pointer ${
                isEditLoading || isAvatarLoading
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
              value={isEditLoading ? "Updating..." : "Update"}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default ProfileInfo;