import { apiSlice } from "../api/apiSlice";
import { userLoggedOut, userLogin, userRegistration } from "../auth/authSlice";

type RegistrationResponse = {
  message: string;
  activationToken: string;
};

type RegistrationData = {
  name: string;
  email: string;
  password: string;
};

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegistrationResponse, RegistrationData>({
      query: (data) => ({
        url: "/user/register",
        method: "POST",
        body: data,
        credentials: "include",
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userRegistration({ token: result.data.activationToken }));
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.log("Error occurred in registration API", error);
          }
        }
      },
    }),

    activation: builder.mutation({
      query: ({ activationToken, activationCode }) => ({
        url: "/user/activate",
        method: "POST",
        body: { activationToken, activationCode },
      }),
    }),

    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "/user/login",
        method: "POST",
        body: { email, password },
        credentials: "include",
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLogin({
              accessToken: result.data.accessToken,
              user: result.data.user,
              isSocial: false, // Standard email/pass login
            })
          );
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.log("Error occurred in login API", error);
          }
        }
      },
    }),

    socialAuth: builder.mutation({
      query: ({ email, name, avatar, accessToken, provider }) => ({
        url: "/user/social-auth",
        method: "POST",
        body: { email, name, avatar, accessToken, provider },
        credentials: "include",
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLogin({
              accessToken: result.data.accessToken,
              user: result.data.user,
              isSocial: true, // Social OAuth login
            })
          );
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.log("Error occurred in socialAuth API", error);
          }
        }
      },
    }),

    logoutUser: builder.query({
      query: () => ({
        url: "/user/logout",
        method: "GET",
        credentials: "include",
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
          dispatch(userLoggedOut());
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.log("Error occurred in logoutUser API", error);
          }
        }
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useActivationMutation,
  useLoginMutation,
  useSocialAuthMutation,
  useLogoutUserQuery
} = authApi;