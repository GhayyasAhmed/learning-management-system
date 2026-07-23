"use client";
import { RootState } from "@/redux/store";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import toast from "react-hot-toast";
import { HiOutlineMenuAlt3, HiOutlineUserCircle } from "react-icons/hi";
import { useSelector } from "react-redux";
import avatar from "../../public/assets/avatardefault.jpg";
import { useSocialAuthMutation } from "../../redux/features/auth/authApi";
import CustomModal from "../utils/CustomModal";
import { getErrorMessage } from "../utils/getErrorMessage";
import NavItems from "../utils/NavItems";
import ThemeSwitcher from "../utils/ThemeSwitcher";
import Login from "./Auth/Login";
import SignUp from "./Auth/SignUp";
import Verification from "./Auth/Verification";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeItem: number;
  route: string;
  setRoute: (route: string) => void;
};

// Helper for client-side hydration detection without extra render cycles
const emptySubscribe = () => () => {};
const useIsMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client snapshot
    () => false  // Server snapshot
  );

const Header = ({ activeItem, open, setOpen, route, setRoute }: Props) => {
  const [active, setActive] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const mounted = useIsMounted();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data } = useSession();
  const [socialAuth, { isSuccess, error }] = useSocialAuthMutation();

  useEffect(() => {
    if (!user) {
      if (data) {
        socialAuth({
          email: data?.user?.email,
          name: data?.user?.name,
          avatar: data?.user?.image,
        });
      }
    }
    if (isSuccess) {
      toast.success("Logged in successfully!");
      setOpen(false);
    }
    if (error) {
      toast.error(getErrorMessage(error, "Social login failed. Please try again."));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user, isSuccess, error]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setActive(true);
      } else {
        setActive(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClose = () => {
    setOpenSidebar(false);
  };

  return (
    <div className="w-full relative">
      <div
        className={`${
          active
            ? "fixed top-0 left-0 w-full h-20 z-80 bg-white border-b border-gray-200 shadow-xl transition duration-500 dark:bg-opacity-50 dark:bg-linear-to-b dark:from-gray-900 dark:to-black dark:border-gray-700"
            : "w-full h-20 z-80 bg-white border-b border-gray-200 dark:bg-transparent dark:border-[#ffffff1c] dark:shadow"
        }`}
      >
        <div className="w-[95%] 800px:w-[92%] m-auto py-2 h-full">
          <div className="w-full h-20 flex items-center justify-between p-2">
            <div>
              <Link
                href="/"
                className="text-[25px] font-poppins font-medium text-black dark:text-white"
              >
                Elearning
              </Link>
            </div>
            <div className="flex items-center">
              <NavItems activeItem={activeItem} isMobile={false} />
              <ThemeSwitcher />
              <div className="800px:hidden">
                <HiOutlineMenuAlt3
                  className="cursor-pointer dark:text-white text-black"
                  onClick={() => setOpenSidebar(true)}
                />
              </div>

              {mounted && user ? (
                <Link href={"/profile"}>
                  <Image
                    src={user.avatar ? user.avatar.url : avatar}
                    alt=""
                    width={30}
                    height={30}
                    className="w-7.5 h-7.5 rounded-full cursor-pointer hidden 800px:block"
                    style={{
                      border: activeItem === 5 ? "2px solid #37a39a" : "",
                    }}
                  />
                </Link>
              ) : (
                <HiOutlineUserCircle
                  size={25}
                  className="cursor-pointer hidden 800px:block dark:text-white text-black"
                  onClick={() => setOpen(true)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile sidebar menu */}
        {openSidebar && (
          <div
            className="fixed w-full h-screen top-0 left-0 z-99999 dark:bg-[unset] bg-[#00000024]"
            onClick={handleClose}
            id="screen"
          >
            <div className="w-[70%] fixed z-999999999 h-screen bg-white top-0 right-0 dark:bg-slate-900 dark:bg-opacity-90">
              <NavItems activeItem={activeItem} isMobile={true} />

              {user ? (
                <Link href={"/profile"}>
                  <Image
                    src={
                      user.avatar ? user.avatar.url : avatar
                    }
                    alt=""
                    width={30}
                    height={30}
                    className="cursor-pointer ml-5 my-2 dark:text-white text-black w-7.5 h-7.5 rounded-full"
                    style={{
                      border: activeItem === 5 ? "2px solid #37a39a" : "",
                    }}
                  />
                </Link>
              ) : (
                <HiOutlineUserCircle
                  size={25}
                  className="cursor-pointer ml-5 my-2 dark:text-white text-black w-7.5 h-7.5 rounded-full"
                  onClick={() => setOpen(true)}
                />
              )}

              <br />
              <br />
              <p className="text-[16px] px-2 pl-5 text-black dark:text-white">
                Copyright ©️ {new Date().getFullYear()} E-Learning
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        {route === "Login" && open && (
          <CustomModal
            open={open}
            setOpen={setOpen}
            setRoute={setRoute}
            activeItem={activeItem}
            LoginComponent={Login}
          />
        )}

        {route === "Sign-Up" && open && (
          <CustomModal
            open={open}
            setOpen={setOpen}
            setRoute={setRoute}
            activeItem={activeItem}
            LoginComponent={SignUp}
          />
        )}

        {route === "Verification" && open && (
          <CustomModal
            open={open}
            setOpen={setOpen}
            setRoute={setRoute}
            activeItem={activeItem}
            LoginComponent={Verification}
          />
        )}
      </div>
    </div>
  );
};

export default Header;