"use client";
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Heading from "../utils/Heading";
import About from "./About";

const Page = () => {
  const [open, setOpen] = useState(false);
  const [activeItem] = useState(2);
  const [route, setRoute] = useState("Login");
  return (
    <div>
      <Heading
        title="About us - ELearning"
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
      <About />
      <Footer />
    </div>
  );
};

export default Page;