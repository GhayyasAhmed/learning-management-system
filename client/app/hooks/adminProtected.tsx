"use client";
import { RootState } from "@/redux/store";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useSelector } from "react-redux";
import { useLoadUserQuery } from "../../redux/features/api/apiSlice";
import useAuth from "./userAuth";

type AdminProtectedProps = {
  children: React.ReactNode;
}

const AdminProtected= ({children}: AdminProtectedProps) => {

    const isAuthenticated = useAuth();
    const { status } = useSession();

    // If Redux already has a user, no need to refetch here.
    const { data, isFetching } = useLoadUserQuery(undefined, {
      skip: isAuthenticated,
    });

    const { user } = useSelector((state: RootState) => state.auth);
    const resolvedUser = user || data?.user;

    // Wait for auth to resolve (both NextAuth + backend session)
    if (status === "loading" || isFetching) return null;

    if (!resolvedUser) return redirect("/");

    const isAdmin = resolvedUser?.role?.toLowerCase() === "admin";
    return isAdmin ? children : redirect("/");
}

export default AdminProtected;