"use client";

import { useState } from "react";
import Header from "../Header";
import Hero from "./Hero";
import Courses from "./Courses";
import Reviews from "./Reviews";
import FAQ from "./FAQ";
import Footer from "../Footer";

// Owns the interactive (auth modal open/route) state for the landing page.
// Split out from app/page.tsx so that route can be a Server Component and
// export static metadata (title/description/canonical/OG) — this content
// component keeps all existing client-side behavior unchanged.
const HomeContent = () => {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState("Login");
  const activeItem = 0;

  return (
    <>
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
    </>
  );
};

export default HomeContent;