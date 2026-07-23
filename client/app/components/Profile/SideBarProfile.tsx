"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import avatarDefault from "../../../public/assets/avatardefault.jpg";
import { RiLockPasswordLine } from "react-icons/ri";
import { SiCoursera } from "react-icons/si";
import { AiOutlineLogout } from "react-icons/ai";
import Link from "next/link";
import { MdOutlineAdminPanelSettings } from "react-icons/md";


type SideBarProfileProps = {
    user: any;
    active: number;
    setActive: (active: number) => void;
    avatar: string | null;
    logOutHandler: any;
}

const SideBarProfile = ({ user, active, setActive, avatar, logOutHandler }: SideBarProfileProps) => {

    return (
        <div className="w-full ">
            {/* Profile */}
            <div
                className={`w-full flex items-center px-3 py-4 cursor-pointer ${active === 1 ? "dark:bg-slate-800  bg-blue-50" : "bg-transparent"
                    }`}
                onClick={() => setActive(1)}
            >
                <Image
                    alt=""
                    src={
                        user.avatar || avatar ? user.avatar.url || avatar : avatarDefault
                    }
                    width={20}
                    height={20}
                    className=" cursor-pointer rounded-full"
                />
                <h5 className="pl-2 800px:block hidden font-Poppins dark:text-white text-black ">
                    My Account
                </h5>
            </div>

            {/* Change Password  */}
            <div
                className={`w-full flex items-center px-3 py-4 cursor-pointer ${active === 2 ? "dark:bg-slate-800  bg-white" : "bg-transparent"
                    }`}
                onClick={() => setActive(2)}
            >
                <RiLockPasswordLine size={20} className="dark:text-white text-black" />
                <h5 className="pl-2 800px:block hidden font-Poppins dark:text-white text-black ">
                    Change Password
                </h5>
            </div>

            {/* Enrolled Courses */}
            <div
                className={`w-full flex items-center px-3 py-4 cursor-pointer ${active === 3 ? "dark:bg-slate-800  bg-white" : "bg-transparent"
                    }`}
                onClick={() => setActive(3)}
            >
                <SiCoursera size={20} className="dark:text-white text-black" />
                <h5 className="pl-2 800px:block hidden font-Poppins dark:text-white text-black ">
                    Enrolled Courses
                </h5>
            </div>

            {/* admin protected Route  */}
            {user.role === "admin" && (
                <Link
                    href={"/admin"}
                    className={`w-full flex items-center px-3 py-4 cursor-pointer ${active === 4 ? "dark:bg-slate-800  bg-white" : "bg-transparent"
                        }`}
                    onClick={() => setActive(4)}
                >
                    <MdOutlineAdminPanelSettings
                        size={20}
                        className="dark:text-white text-black"
                    />
                    <h5 className="pl-2 800px:block hidden font-Poppins dark:text-white text-black ">
                        Admin Dashboard
                    </h5>
                </Link>
            )}

            {/* Logout */}
            <div
                className={`w-full flex items-center px-3 py-4 cursor-pointer ${active === 5 ? "dark:bg-slate-800  bg-white" : "bg-transparent"
                    }`}
                onClick={() => logOutHandler()}
            >
                <AiOutlineLogout size={20} className="dark:text-white text-black" />
                <h5 className="pl-2 800px:block hidden font-Poppins dark:text-white text-black ">
                    Log Out
                </h5>
            </div>

        </div>

    )
}

export default SideBarProfile;