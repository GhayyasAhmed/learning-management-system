"use client";
import Link from "next/link";
import { useState } from "react";
import NavItems from "../utils/NavItems";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeItem: number;
//   route: string;
//   setRoute: (route: string) => void;
};

const Header = ({ activeItem, open, setOpen }: Props) => {
  const [active, setActive] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 80) {
        setActive(true);
      } else {
        setActive(false);
      }
    });
  }
  return (
    <div className="w-full relative">
      <div
        className={`${active ? "dark:bg-opacity-50 dark:bg-linear-to-b dark:from-gray-900 dark:to-black fixed top-0 left-0 w-full h-20 z-80 border-b dark:border-[#ffffff1c] shadow-xl transition duration-500" : "w-full border-b dark:border-[ffffff1c] h-20 z-80 dark:shadow"}`}
      >
        <div className="w-[95%] 800px:w-[92%] m-auto py-2 h-full">
          <div className="w-full h-20 flex items-center justify-between p-2">
            <div>
              <Link
                href="/"
                className="text-[25px] font-poppins font-medium text-black dark:text-white"
              >
                ELearning
              </Link>
            </div>
            <div className="flex items-center">
                <NavItems activeItem={activeItem} isMobile={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
