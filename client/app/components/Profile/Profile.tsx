"use client";
import { useEffect, useState } from "react";
import SideBarProfile from "./SideBarProfile";
import { useLogoutUserQuery } from "../../../redux/features/auth/authApi";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { userLoggedOut, IUser } from "../../../redux/features/auth/authSlice";

type Props = {
  user: IUser;
};

const Profile = ({ user }: Props) => {
  const [scroll, setScroll] = useState(false);
  const [active, setActive] = useState(1);
  const { data: session } = useSession();
  const [avatar] = useState(null);
  const [logout, setLogout] = useState(false)
  const {} = useLogoutUserQuery(undefined, {skip: !logout ? true: false});
  const dispatch = useDispatch();

  const logOutHandler = async () => {
    setLogout(true)
    await signOut()
    // try {
    //   await logoutUser().unwrap();
    // } catch (err) {
    //   console.log("Logout backend request failed (clearing client state):", err);
    // } finally {
    //   dispatch(userLoggedOut());
    //   if (session) {
    //     await signOut({ callbackUrl: "/" });
    //   } else {
    //     toast.success("Logged out successfully!");
    //   }
    // }
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
    </div>
  );
};

export default Profile;