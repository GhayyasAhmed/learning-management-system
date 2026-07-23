"use client";

import { ThemeProvider } from "@/app/utils/theme-provide";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { store } from "@/redux/store";
import { SessionProvider } from "next-auth/react";
import React, { useSyncExternalStore } from "react";
import { Provider } from "react-redux";
import Loader from "./components/Loader/Loader";

// Helper subscriptions for useSyncExternalStore
const emptySubscribe = () => () => {};
const useIsMounted = () => {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client value
    () => false  // Server (SSR) value
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <Custom>{children}</Custom>
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  );
}

const Custom = ({ children }: { children: React.ReactNode }) => {
  const isMounted = useIsMounted();
  const { isLoading } = useLoadUserQuery({}, { skip: !isMounted });

  // During SSR / initial hydration pass
  if (!isMounted) {
    return <>{children}</>;
  }

  return <>{isLoading ? <Loader /> : children}</>;
};