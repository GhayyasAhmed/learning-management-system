"use client";
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Heading from "../utils/Heading";
import Policy from "./Policy";


const Page = () => {
  const [open, setOpen] = useState(false);
  const [activeItem] = useState(3);
  const [route, setRoute] = useState("Login");
  return (
    <div>
      <Heading
        title="Policy - ELearning"
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
     <Policy/>
      <Footer />
    </div>
  );
};

export default Page;