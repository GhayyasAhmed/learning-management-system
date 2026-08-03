"use client";
import { RootState } from "@/redux/store";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineMenuAlt3, HiOutlineUserCircle } from "react-icons/hi";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import avatar from "../../public/assets/avatardefault.jpg";
import {
  useLogoutUserQuery,
  useSocialAuthMutation,
} from "../../redux/features/auth/authApi";
import { userLoggedOut } from "../../redux/features/auth/authSlice";
import useIsMounted from "../hooks/useIsMounted";
import CustomModal from "../utils/CustomModal";
import { getErrorMessage } from "../utils/getErrorMessage";
import NavItems from "../utils/NavItems";
import ThemeSwitcher from "../utils/ThemeSwitcher";
import Login from "./Auth/Login";
import SignUp from "./Auth/SignUp";
import Verification from "./Auth/Verification";

interface CustomSession extends Session {
  accessToken?: string;
  provider?: string;
}

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeItem: number;
  route: string;
  setRoute: (route: string) => void;
};


const Header = ({ activeItem, open, setOpen, route, setRoute }: Props) => {
  const [active, setActive] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch();

  // Extract isSocial flag from state
  const { user, isSocial } = useSelector((state: RootState) => state.auth);
  const { data } = useSession();
  // const [logout, setLogout] = useState(false)
  const [socialAuth, { isSuccess, error }] = useSocialAuthMutation();
  const shouldLogout = data === null && isSocial && !!user;
  const { isSuccess: isLogoutSuccess } = useLogoutUserQuery(undefined, {
    skip: !shouldLogout,
  });
  // const {} = useLogoutUserQuery(undefined, {skip: !logout ? true: false});
  // const [logoutUser] = useLogoutUserMutation();

  // The provider access token (and which provider issued it) that NextAuth
  // attaches to the session via the jwt/session callbacks. This is what
  // proves the sign-in actually happened with Google/GitHub; the backend
  // independently re-verifies it before trusting any identity from it.
  const customSession = data as CustomSession | null;
  const sessionAccessToken = customSession?.accessToken;
  const sessionProvider = customSession?.provider;

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openSidebar) return;
    mobileDrawerRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenSidebar(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openSidebar]);

  // Trigger social auth only when the session identity itself changes (a
  // fresh NextAuth sign-in). Deliberately does NOT depend on isSuccess/error
  // — those reflect the outcome of an attempt, not a new attempt to make.
  // Depending on them here previously caused a failed attempt to be
  // retried on every re-render, producing an infinite request loop.
  useEffect(() => {
    if (!user && data?.user && sessionAccessToken && sessionProvider) {
      socialAuth({
        email: data.user.email,
        name: data.user.name,
        avatar: data.user.image,
        accessToken: sessionAccessToken,
        provider: sessionProvider,
      });
    }
  }, [data, user, sessionAccessToken, sessionProvider, socialAuth]);

  // Surface the outcome of a social auth attempt (success/error feedback
  // only). Kept separate from the trigger effect above so that resolving
  // to an error never re-invokes socialAuth.
  useEffect(() => {
    if (data === null && isSuccess) {
      toast.success("Logged in successfully!");
      setOpen(false);
    }

    if (error) {
      toast.error(
        getErrorMessage(error, "Social login failed. Please try again."),
      );
    }
  }, [data, isSuccess, error, setOpen]);

  useEffect(() => {
    if (isLogoutSuccess) {
      dispatch(userLoggedOut());
      toast.success("Logged out successfully!");
    }
  }, [isLogoutSuccess, dispatch]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setActive(window.scrollY > 80);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClose = () => {
    setOpenSidebar(false);
    menuButtonRef.current?.focus();
  };

  return (
    <header className="w-full relative">
      <div className="w-full h-20" aria-hidden="true" />
      <div
        className={`fixed top-0 left-0 w-full h-20 z-80 bg-white border-b border-gray-200 transition duration-500 dark:border-gray-700 ${
          active
            ? "shadow-xl dark:bg-opacity-50 dark:bg-linear-to-b dark:from-gray-900 dark:to-black"
            : "dark:bg-transparent dark:border-[#ffffff1c] dark:shadow"
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
              {isMounted &&
                user &&
                typeof user === "object" &&
                user.role === "admin" && (
                  <Link href={"/admin"} className="mr-3 hidden 800px:block">
                    <MdOutlineAdminPanelSettings
                      className="cursor-pointer dark:text-white text-black"
                      size={24}
                      title="Admin Dashboard"
                    />
                  </Link>
                )}

              <div className="800px:hidden">
                <button
                  type="button"
                  aria-label="Open menu"
                  ref={menuButtonRef}
                  className="cursor-pointer dark:text-white text-black bg-transparent border-0 p-0 flex items-center"
                  onClick={() => setOpenSidebar(true)}
                >
                  <HiOutlineMenuAlt3 />
                </button>
              </div>

              {isMounted && user ? (
                <Link href={"/profile"}>
                  <Image
                    src={
                      typeof user === "object" && user?.avatar?.url
                        ? user.avatar.url
                        : avatar
                    }
                    alt="User avatar"
                    width={30}
                    height={30}
                    className="w-7.5 h-7.5 rounded-full cursor-pointer hidden 800px:block"
                    style={{
                      border: activeItem === 5 ? "2px solid #37a39a" : "",
                    }}
                  />
                </Link>
              ) : (
                <button
                  type="button"
                  aria-label="Open login"
                  className="cursor-pointer hidden 800px:block dark:text-white text-black bg-transparent border-0 p-0"
                  onClick={() => setOpen(true)}
                >
                  <HiOutlineUserCircle size={25} />
                </button>
              )}
            </div>
          </div>
        </div>

        {openSidebar && (
          <div
            className="fixed w-full h-screen top-0 left-0 z-99999 dark:bg-[unset] bg-[#00000024]"
            onClick={handleClose}
            id="screen"
          >
            <div
              className="w-[70%] fixed z-999999999 h-screen bg-white top-0 right-0 dark:bg-slate-900 dark:bg-opacity-90"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile menu"
              tabIndex={-1}
              ref={mobileDrawerRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close menu"
                className="absolute top-4 right-4 dark:text-white text-black bg-transparent border-0 text-2xl"
                onClick={handleClose}
              >
                &times;
              </button>
              <NavItems activeItem={activeItem} isMobile={true} />
              {isMounted && user ? (
                <Link href={"/profile"}>
                  <Image
                    src={
                      typeof user === "object" && user?.avatar?.url
                        ? user.avatar.url
                        : avatar
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
    </header>
  );
};

export default Header;
