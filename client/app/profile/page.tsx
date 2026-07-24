"use client";

import { IUser } from "@/redux/features/auth/authSlice";
import { RootState } from "@/redux/store";
import { useState } from "react";
import { useSelector } from "react-redux";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Profile from "../components/Profile/Profile";
import Protected from "../hooks/useProtected";
import Heading from "../utils/Heading";

interface ProfilePagePresenterProps {
  user: IUser;
  open: boolean;
  setOpen: (open: boolean) => void;
  activeItem: number;
  route: string;
  setRoute: (route: string) => void;
}

// ---------------------------------------------------------
// Presenter Component: Pure UI & Layout Rendering
// ---------------------------------------------------------
export const ProfilePagePresenter = ({
  user,
  open,
  setOpen,
  activeItem,
  route,
  setRoute,
}: ProfilePagePresenterProps) => {
  return (
    <Protected>
      <Heading
        title={`${user?.name || "User"} Profile - ELearning`}
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
      <Footer />
    </Protected>
  );
};

// ---------------------------------------------------------
// Container Component: State, Selectors & Logic
// ---------------------------------------------------------
const ProfilePage = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [activeItem] = useState<number>(5);
  const [route, setRoute] = useState<string>("Login");

  const authUser = useSelector((state: RootState) => state.auth.user);

  // Type guard/narrowing matching the exact authSlice IUser definition
  const user: IUser =
    typeof authUser === "object" && authUser !== null
      ? (authUser as IUser)
      : { _id: "", name: "", email: "", avatar: { url: "" } };

  return (
    <ProfilePagePresenter
      user={user}
      open={open}
      setOpen={setOpen}
      activeItem={activeItem}
      route={route}
      setRoute={setRoute}
    />
  );
};

export default ProfilePage;