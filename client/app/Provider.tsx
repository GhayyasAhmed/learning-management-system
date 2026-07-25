"use client";

import { ThemeProvider } from "@/app/utils/theme-provide";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { store } from "@/redux/store";
import { SessionProvider } from "next-auth/react";
import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { Provider } from "react-redux";
import socketIO, { Socket } from "socket.io-client";
import Loader from "./components/Loader/Loader";

// Helper subscriptions for useSyncExternalStore to prevent SSR hydration mismatch
const emptySubscribe = () => () => {};
const useIsMounted = () => {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // Client value
    () => false // Server (SSR) value
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
  const socketRef = useRef<Socket | null>(null);

  // Load current user details once mounted on client
  const { isLoading } = useLoadUserQuery({}, { skip: !isMounted });

  useEffect(() => {
    if (!isMounted) return;

    const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "/";
    const socket = socketIO(ENDPOINT, { transports: ["websocket"] });
    socketRef.current = socket;

    const onConnect = () => {
      console.log("Connected to socket", socket.id);
    };

    const onDisconnect = (reason: unknown) => {
      console.log("Socket disconnected:", reason);
    };

    const onConnectError = (err: unknown) => {
      const msg =
        typeof err === "object" && err && "message" in err
          ? (err as { message?: unknown }).message
          : err;
      console.log("Socket connect_error:", msg);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // If the socket connected before this effect ran, "connect" won't fire again.
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isMounted]);

  // Ensure SSR and first client render match
  if (!isMounted) {
    return <>{children}</>;
  }

  return <>{isLoading ? <Loader /> : children}</>;
};