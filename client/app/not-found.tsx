import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-black dark:text-white">
      <h1 className="text-3xl font-Poppins mb-4">Page not found</h1>
      <Link href="/" className="text-[#2190ff] underline">
        Return home
      </Link>
    </div>
  );
}