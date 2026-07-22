"use client";
import Image from "next/image";
import Link from "next/link";
// import { useRouter } from "next/navigation";
import { ChangeEvent, SubmitEvent, useState } from "react";
import { BiSearch } from "react-icons/bi";

const Hero = () => {
  const [search, setSearch] = useState("");
  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search === "") {
      return;
    }
    // else {
    //   router.push(`/courses?title=${search}`);
    // }
  };
  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row items-center justify-center lg:justify-between px-4 lg:px-8 py-10 lg:py-0 relative overflow-hidden">
      {/* Animated background circle */}
      <div className="absolute top-18.75 lg:left-25  w-75 h-75 lg:w-125 lg:h-125 hero_animation rounded-full opacity-20 lg:opacity-30"></div>
      {/* Hero banner Image */}
      <div className="lg:w-1/2 flex items-center justify-center z-10 mb-8 lg:mb-0">
        <Image
          src={
            // data?.layout?.banner?.image?.url ||
            "/assets/hero-banner-1.png"
          }
          width={400}
          height={400}
          alt={
            // data?.layout?.banner?.title ||
            "Hero Banner"
          }
          className="object-contain w-full max-w-25 lg:max-w-100 h-auto"
          priority
        />
      </div>
      {/* Hero content section */}
      <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left z-10">
        {/* Main headline */}
        <h1 className="text-3xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-4 leading-tight">
          {
            //   data?.layout?.banner?.title ||
            "Improve Your Skills with Expert-Led Courses"
          }
        </h1>
        {/* Subtitle or description */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
          {
            //   data?.layout?.banner?.subTitle ||
            "We have 40k+ online courses taught by industry experts to help you achieve your goals."
          }
        </p>
        {/* Search form */}
        <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
          <div className="relative">
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              type="search"
              placeholder="Search Courses..."
              className="w-full h-12 px-4 pr-12 text-lg text-gray-700 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
            //   onClick={handleSearch}
              className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-blue-500 rounded-r-lg hover:bg-blue-600 transition-colors"
            >
              <BiSearch className="text-white" size={24} />
            </button>
          </div>
        </form>
        {/* Trust indicators - client avatars and text */}
        <div className="flex items-center space-x-4">
          <div className="flex gap-4">
            <Image
              src="/assets/client-1.jpg"
              alt="Client 1"
              width={40}
              height={40}
              className="rounded-full"
            />

            <Image
              src="/assets/client-2.jpg"
              alt="Client 2"
              width={40}
              height={40}
              className="rounded-full -ml-5"
            />

            <Image
              src="/assets/client-3.jpg"
              alt="Client 3"
              width={40}
              height={40}
              className="rounded-full -ml-5"
            />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold">500K+</span> People already trust
            us.{" "}
            <Link href="/courses" className="text-blue-500 hover:underline">
              View Courses
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
