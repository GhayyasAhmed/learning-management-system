"use client";
import { redirect } from "next/navigation";
import useAuth from "./userAuth";
import { useSession } from "next-auth/react";
import { useLoadUserQuery } from "../../redux/features/api/apiSlice";


type ProtectedProps = {
  children: React.ReactNode;
}

const Protected= ({children}: ProtectedProps) => {
    const isAuthenticated = useAuth();
    const { status } = useSession();
    const { isFetching } = useLoadUserQuery(undefined, {
      skip: isAuthenticated,
    });

    if (isAuthenticated) return children;

    // Allow rendering when NextAuth is still determining status
    if (status === "loading" || isFetching) return null;

    // If NextAuth says authenticated, allow children so Header can complete socialAuth
    if (status === "authenticated") return children;

    return redirect("/");
}

export default Protected;