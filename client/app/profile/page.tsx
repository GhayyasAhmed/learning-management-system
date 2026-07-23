"use client";
import { RootState } from "@/redux/store";
import { useState } from "react";
import { useSelector } from "react-redux";
import Header from "../components/Header";
import Protected from "../hooks/useProtected";
import Heading from "../utils/Heading";
import Profile from "../components/Profile/Profile";
// import Footer from "../components/Footer";

type Props = {};

const Page = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(5);
  const [route, setRoute] = useState("Login");
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Protected>
      <Heading
        title={`${user?.name} Profile-ELearning`}
        description="ELearning is a platform for online learning and education."
        keywords="ELearning, online learning, education, courses, tutorials, training"
      />
      <Header
        open={open}
        setOpen={setOpen}
        activeItem={activeItem}
        setRoute={setRoute}
        route={route}
      />
      <Profile user={user} />
    </Protected>
  );
};

export default Page;
