import { apiSlice } from "../api/apiSlice";
export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrders: builder.query({
      query: () => ({
        url: "/order/admin/all",
        method: "GET",
        credentials: "include" as const,
      }),
    }),

    getStripePublishAbleKey: builder.query({
      query: () => ({
        url: "payment/stripePublishAbleKey",
        method: "GET",
        credentials: "include" as const,
      }),
    }),

    createPaymentIntent: builder.mutation({
      // The server derives the amount from the course price, so we only send the id.
      query: (courseId) => ({
        url: "payment/process",
        method: "POST",
        body: { courseId },
        credentials: "include" as const,
      }),
    }),

    createOrder: builder.mutation({
      query: ({ courseId, paymentInfo }) => ({
        url: "/order/create",
        method: "POST",
        body: { courseId, paymentInfo },
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  useGetAllOrdersQuery,
  useCreateOrderMutation,
  useCreatePaymentIntentMutation,
  useGetStripePublishAbleKeyQuery,
} = orderApi;