"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { BiMoon, BiSun } from "react-icons/bi";

// Helper to detect if running in browser
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

const ThemeSwitcher = () => {
  const isMounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const { theme, setTheme } = useTheme();

  if (!isMounted) return null;

  return (
    <div className="flex items-center justify-center mx-4">
      {theme === "light" ? (
        <BiMoon
          className="cursor-pointer"
          fill="black"
          size={25}
          onClick={() => setTheme("dark")}
        />
      ) : (
        <BiSun
          className="cursor-pointer"
          fill="white"
          size={25}
          onClick={() => setTheme("light")}
        />
      )}
    </div>
  );
};

export default ThemeSwitcher