"use client";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

const useIsMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

export default useIsMounted;