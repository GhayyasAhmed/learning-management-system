"use client";

import { useUpdatePasswordMutation } from "../../../redux/features/user/userApi";
import { styles } from "../../styles/styles";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/getErrorMessage";

/* eslint-disable @typescript-eslint/no-explicit-any */


const ChangePassword = () => {

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [updatePassword, { isSuccess, error, isLoading }] = useUpdatePasswordMutation();

    useEffect(() => {
      if (isSuccess) {
        toast.success("Password updated successfully");
      }
      if (error) {
        toast.error(getErrorMessage(error, "Could not update password. Please try again."));
      }
    }, [error, isSuccess]);

    const passwordChangeHandler = async (e: any) => {
      e.preventDefault();
      const trimmedOld = oldPassword.trim();
      const trimmedNew = newPassword.trim();
      const trimmedConfirm = confirmPassword.trim();

      if (!trimmedOld || !trimmedNew || !trimmedConfirm) {
        toast.error("Please fill in all password fields");
        return;
      }
      if (trimmedNew.length < 8) {
        toast.error("New password must be at least 8 characters");
        return;
      }
      if (trimmedNew !== trimmedConfirm) {
        toast.error("New password and confirm password do not match");
        return;
      }
      if (trimmedNew === trimmedOld) {
        toast.error("New password must be different from old password");
        return;
      }
      await updatePassword({
        oldPassword: trimmedOld,
        newPassword: trimmedNew,
        confirmPassword: trimmedConfirm,
      });
    };
  
    return (
      <div className="w-full pl-7 px-2 800px:px-5 800px:pl-0">
        {/* Page Title */}
        <h1 className="block text-2xl 800px:text-3xl font-Poppins text-center font-medium text-black pb-2 dark:text-white ">
          Change Password
        </h1>
        <div className="w-full">
          {/* Password Change Form */}
          <form
            onSubmit={passwordChangeHandler}
            className="flex flex-col items-center"
          >
            {/* Old Password  */}
            <div className="w-full 800px:w-[60%] mt-5">
              <label
                htmlFor="old-password"
                className="block pb-2 dark:text-white text-black"
              >
                Old Password
              </label>
              <input
                type="password"
                name=""
                id="old-password"
                className={`${styles.input} w-[95%]! mb-4 800px:mb-0`}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            {/* New Password  */}
            <div className="w-full 800px:w-[60%] mt-5">
              <label
                htmlFor="new-password"
                className="block pb-2 dark:text-white text-black"
              >
                New Password
              </label>
              <input
                type="password"
                name=""
                id="new-password"
                className={`${styles.input} w-[95%]! mb-4 800px:mb-0`}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {/* Confirm Password  */}
            <div className="w-full 800px:w-[60%] mt-5">
              <label
                htmlFor="confirm-password"
                className="block pb-2 text-black dark:text-white"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                name=""
                id="confirm-password"
                className={`${styles.input} w-[95%]! mb-4 800px:mb-0`}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {/* Submit Button */}
              <input
                type="submit"
                disabled={isLoading}
                className={`w-[95%]! 800px:w-62.5 h-10 border border-[cyan] text-center dark:text-white text-black rounded-[3px] mt-8 cursor-pointer ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                value={isLoading ? "Updating..." : "Update"}
                onClick={(e) => { if (isLoading) e.preventDefault(); }}
              />
            </div>
          </form>
        </div>
      </div>
    );
}

export default ChangePassword;