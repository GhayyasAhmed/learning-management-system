"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-black dark:text-white">
      <h1 className="text-2xl font-Poppins mb-4">Something went wrong</h1>
      <button
        type="button"
        className="px-6 py-2 rounded bg-[#37a39a] text-white cursor-pointer"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}