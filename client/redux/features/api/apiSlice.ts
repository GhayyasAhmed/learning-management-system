import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedOut, userLogin } from "../auth/authSlice";

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_SERVER_URL,
    }),
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

            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const result = await queryFulfilled;
                    const user = result.data?.user;
                    // Don't treat "guest" (missing _id) as logged in
                    if (user && typeof user === "object" && user._id) {
                        dispatch(
                            userLogin({
                                accessToken: result.data.accessToken,
                                user,
                            })
                        );
                    } else {
                        dispatch(userLoggedOut());
                    }
                } catch (error) {
                    console.log("Error occured in loadUser api", error);
                }
            },
        }),
    })
})

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;
