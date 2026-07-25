"use client";
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import FAQ from "../components/Route/FAQ";
import Heading from "../utils/Heading";

const Page = () => {
  const [open, setOpen] = useState(false); 
  const [activeItem] = useState(4);
  const [route, setRoute] = useState("Login");
  return (
    <div className="min-h-screen">
      <Heading
        title="FAQS - ELearning"
        description="ELearning is a learning management system for helping programmers"
        keywords="programming,MERN"
      />
      <Header
        open={open}
        setOpen={setOpen}
        activeItem={activeItem}
        setRoute={setRoute}
        route={route}
      />
      <br />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Page;