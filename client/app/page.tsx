"use client";

import { useState } from "react";
import Heading from "./utils/Heading";
import Header from "./components/Header";
import Hero from "./components/Route/Hero";
import Courses from "./components/Route/Courses";
import Reviews from "./components/Route/Reviews";
import FAQ from "./components/Route/FAQ";
import Footer from "./components/Footer";

const Page = () => {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState("Login");
  const activeItem = 0;

  return (
    <div>
      <Heading
        title="LMS - Learn from the best"
        description="Learn from the best instructors and experts in the industry. Join our LMS platform to access high-quality courses and enhance your skills."
        keywords="LMS, online learning, courses, education, skills, instructors"
      />

      <Header
        open={open}
        setOpen={setOpen}
        activeItem={activeItem}
        route={route}
        setRoute={setRoute}
      />

      <Hero />
      <Courses />
      <Reviews />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Page;