"use client"

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "../redux/store";

type ProviderProps = {
    children: ReactNode;
}


export const Providers= ({children}: ProviderProps) => {
    return <Provider store={store}>{children}</Provider>;
}