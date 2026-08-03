import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { userLoggedOut, userLogin } from "../auth/authSlice";
import toast from "react-hot-toast";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_SERVER_URL,
});

let isHandlingUnauthorized = false;


// Added missing '<' before string
const baseQueryWithAuthHandling: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        if (!isHandlingUnauthorized) {
            isHandlingUnauthorized = true;
            const state = api.getState() as { auth?: { user?: unknown } };
            if (state?.auth?.user) {
                toast.error("Session expired. Please login again.");
            }
            api.dispatch(userLoggedOut());
            setTimeout(() => {
                isHandlingUnauthorized = false;
            }, 2000);
        }
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithAuthHandling,
    endpoints: (builder) => ({
        refreshToken: builder.query({
            query: () => ({
                url: "/user/refreshtoken",
                method: "GET",
                credentials: "include",
            }),
        }),

        loadUser: builder.query({
            query: () => ({
                url: "/user/me",
                method: "GET",
                credentials: "include",
            }),

            async onQueryStarted(arg, { queryFulfilled, dispatch, getState }) {
                try {
                    const result = await queryFulfilled;
                    const user = result.data?.user;
                    const currentState = getState() as { auth?: { isSocial?: boolean } };
                    // Don't treat "guest" (missing _id) as logged in
                    if (user && typeof user === "object" && user._id) {
                        dispatch(
                            userLogin({
                                accessToken: result.data.accessToken,
                                user,
                                isSocial: currentState.auth?.isSocial ?? false,
                            })
                        );
                    } else {
                        dispatch(userLoggedOut());
                    }
                } catch (error: unknown) {
                    if (process.env.NODE_ENV !== "production") {
                        console.log("Error occured in loadUser api", error);
                    }
                }
            },
        }),
    }),
});

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;