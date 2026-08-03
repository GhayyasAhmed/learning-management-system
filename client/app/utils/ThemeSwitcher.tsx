"use client";

import { useTheme } from "next-themes";
import { BiMoon, BiSun } from "react-icons/bi";
import useIsMounted from "../hooks/useIsMounted";

const ThemeSwitcher = () => {
  const isMounted = useIsMounted();
  const { theme, setTheme } = useTheme();

  if (!isMounted) return null;

  return (
    <div className="flex items-center justify-center mx-4">
      <button
        type="button"
        aria-label={
          theme === "light" ? "Switch to dark mode" : "Switch to light mode"
        }
        className="cursor-pointer bg-transparent border-0 p-0 flex items-center"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? (
          <BiMoon fill="black" size={25} />
        ) : (
          <BiSun fill="white" size={25} />
        )}
      </button>
    </div>
  );
};

export default ThemeSwitcher