"use client";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useLogoutUserQuery } from "../../../redux/features/auth/authApi";
import { IUser, userLoggedOut } from "../../../redux/features/auth/authSlice";
import SideBarProfile from "./SideBarProfile";
import ProfileInfo from "./ProfileInfo";

// import CourseCard from "../Courses/CourseCard";
import ChangePassword from "./ChangePassword";

type Props = {
  user: IUser;
};

const Profile = ({ user }: Props) => {
  const [scroll, setScroll] = useState(false);
  const [active, setActive] = useState(1);
  const { data: session } = useSession();
  const [avatar] = useState(null);
  const [logout, setLogout] = useState(false);
  // const [courses, setCourses] = useState<unknown[]>([]);
  const { isSuccess: isLogoutSuccess } = useLogoutUserQuery(undefined, {
    skip: !logout ? true : false,
  });
  const dispatch = useDispatch();

  const logOutHandler = async () => {
    setLogout(true);
    if (session) {
      await signOut();
    }
  };

  useEffect(() => {
    if (isLogoutSuccess) {
      dispatch(userLoggedOut());
      toast.success("Logged out successfully!");
    }
  }, [isLogoutSuccess, dispatch]);

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
        {/* 
        {active === 3 && (
          <div className="w-full pl-7 px-2 800px:px-10 800px:pl-8 ">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 xl:grid-cols-3 xl:gap-8.75">
              {courses &&
                courses.map((item: unknown, index: number) => (
                  <CourseCard item={item} key={index} isProfile={true} />
                ))}
            </div>
            {courses.length === 0 && (
              <h1 className="text-center text-[18px] font-Poppins">
                {`You don't have any purchased courses!`}
              </h1>
            )}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Profile;
