"use client"

// interface Props {}
import { useState } from "react";
import Header from "./components/Header"
import Hero from "./components/Route/Hero";

export default function Page() {
  const [open, setOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(0)
  return (
    <div>
      <Header
        open={open}
        setOpen={setOpen}
        activeItem={activeItem}
      />
      <Hero />
    </div>
  );
}