import { RootState } from "@/redux/store";
import Link from "next/link";
import { useSelector } from "react-redux";

export const navItemsData = [
  {
    name: "Home",
    url: "/",
  },
  {
    name: "Courses",
    url: "/courses",
  },
  {
    name: "About",
    url: "/about",
  },
  {
    name: "Policy",
    url: "/policy",
  },
  {
    name: "FAQ",
    url: "/faq",
  },
];

type Props = {
  activeItem: number;
  isMobile: boolean;
};

const NavItems = ({ activeItem, isMobile }: Props) => {
  const { user } = useSelector((state: RootState) => state.auth);
  return (
    <nav aria-label={isMobile ? "Mobile" : "Primary"}>
      {/* Desktop Navigation */}
      <div className="hidden 800px:flex">
        {navItemsData &&
          navItemsData.map((i, index) => (
            <Link href={`${i.url}`} key={index} aria-current={activeItem === index ? "page" : undefined}>
              <span
                className={`${
                  activeItem === index
                    ? "dark:text-[#37a39a] text-[crimson]"
                    : "dark:text-white text-black"
                } text-[18px] px-6 font-Poppins font-normal`}
              >
                {i.name}
              </span>
            </Link>
          ))}
      </div>
      {/* Mobile Navigation */}
      {isMobile && (
        <div className="800px:hidden mt-5">
          <div className="w-full text-center py-6">
            <Link href={"/"}>
              <span
                className={`text-[25px] font-Poppins text-black font-medium dark:text-white`}
              >
                E-Learning
              </span>
            </Link>
          </div>
          {/* Mobile Nav Items */}
          {navItemsData &&
            navItemsData.map((i, index) => (
              <Link href={`${i.url}`} key={index} aria-current={activeItem === index ? "page" : undefined}>
                <span
                  className={`${
                    activeItem === index
                      ? "dark:text-[#37a39a] text-[crimson]"
                      : "dark:text-white text-black"
                  } block py-5 text-[18px] px-6 font-Poppins font-normal`}
                >
                  {i.name}
                </span>
              </Link>
            ))}
          {user && typeof user === "object" && user.role === "admin" && (
            <Link href={"/admin"}>
              <span className="dark:text-white text-black block py-5 text-[18px] px-6 font-Poppins font-normal">
                Admin Dashboard
              </span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavItems;