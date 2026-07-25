"use client";
import { useEffect, useState } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import SideBarProfile from "./SideBarProfile";
// Make sure this mutation or lazy query exists in authApi.ts
import { useLogoutUserQuery } from "../../../redux/features/auth/authApi";
import { signOut } from "next-auth/react";
import ProfileInfo from "./ProfileInfo";
import toast from "react-hot-toast";
import ChangePassword from "./ChangePassword";
import CourseCard from "../Courses/CourseCard";
import { useGetUsersAllCoursesQuery } from "../../../redux/features/courses/courseApi";
import { useDispatch } from "react-redux";
import { userLoggedOut } from "../../../redux/features/auth/authSlice";

type Props = {
  user: any;
};

const Profile = ({ user }: Props) => {
  const [scroll, setScroll] = useState(false);
  const [active, setActive] = useState(1);
  const [avatar] = useState(null);
  const [logout, setLogout] = useState(false);
  const dispatch = useDispatch();

  // Lazy trigger logout query when user clicks logout button
  useLogoutUserQuery(undefined, { skip: !logout });

  const { data } = useGetUsersAllCoursesQuery(undefined, {});

  // Derive user courses directly from RTK Query data instead of using useEffect/setState
  const userCourseIds = new Set(
    user?.courses?.map((item: any) => item.courseId) || []
  );

  const courses =
    data?.courses?.filter((course: any) => userCourseIds.has(course._id)) || [];

  const logOutHandler = async () => {
    try {
      setLogout(true);
    } catch (err) {
      console.log("Logout request failed (continuing local logout):", err);
    } finally {
      dispatch(userLoggedOut());
      toast.success("Logged out successfully!");
      await signOut({ redirect: true, callbackUrl: "/" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 85) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-[85%] flex mx-auto">
      <div
        className={`w-15 800px:w-77.5 h-112.5 dark:bg-slate-900 bg-[#f5f5f5] bg-opacity-90 border dark:border-[#ffffff1d] border-[#00000012] rounded-[5px] shadow-md dark:shadow-sm mt-20 mb-20 sticky ${
          scroll ? "top-30" : "top-8"
        } left-8`}
      >
        <SideBarProfile
          user={user}
          active={active}
          setActive={setActive}
          avatar={avatar}
          logOutHandler={logOutHandler}
        />
      </div>

      <div className="w-full h-full bg-transparent mt-20">
        {active === 1 && <ProfileInfo user={user} avatar={avatar} />}
        {active === 2 && <ChangePassword />}
        {active === 3 && (
          <div className="w-full pl-7 px-2 800px:px-10 800px:pl-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 xl:grid-cols-3 xl:gap-8.75">
              {courses.map((item: any, index: number) => (
                <CourseCard item={item} key={item._id || index} isProfile={true} />
              ))}
            </div>
            {courses.length === 0 && (
              <h1 className="text-center text-[18px] font-Poppins">
                You don&apos;t have any purchased courses!
              </h1>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;