"use client";

import { ThemeProvider } from "@/app/utils/theme-provide";
import { apiSlice } from "@/redux/features/api/apiSlice";
import { AppDispatch, store } from "@/redux/store";
import { SessionProvider } from "next-auth/react";
import React, { useEffect, useRef } from "react";
import { Provider, useDispatch } from "react-redux";
import socketIO, { Socket } from "socket.io-client";
import useIsMounted from "./hooks/useIsMounted";


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
  
  // Use typed AppDispatch to allow Thunk actions like .initiate()
  const dispatch = useDispatch<AppDispatch>();
  const bootstrapped = useRef(false);

  // Refresh session then load user once, without blocking render.
  useEffect(() => {
    if (!isMounted || bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      await dispatch(apiSlice.endpoints.refreshToken.initiate({}));
      dispatch(apiSlice.endpoints.loadUser.initiate({}));
    })();
  }, [isMounted, dispatch]);

  useEffect(() => {
    if (!isMounted) return;

    const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "/";
    const socket = socketIO(ENDPOINT, { transports: ["websocket"] });
    socketRef.current = socket;

    const onConnect = () => {
      if (process.env.NODE_ENV !== "production") {
        console.log("Connected to socket");
      }
    };

    const onDisconnect = (reason: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("Socket disconnected:", reason);
      }
    };

    const onConnectError = (err: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        const msg =
          typeof err === "object" && err && "message" in err
            ? (err as { message?: unknown }).message
            : err;
        console.log("Socket connect_error:", msg);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

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

  return <>{children}</>;
};