import { apiSlice } from "../api/apiSlice";
export const layoutApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createLayout: builder.mutation({
      query: ({ data }) => ({
        url: "/layout/admin/create",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
    }),

    getHeroData: builder.query({
      query: (type: string) => ({
        url: `/layout/get/${type}`,
        method: "GET",
      }),
    }),

    editLayout: builder.mutation({
      query: ({ type, image, title, subTitle, faq, categories }) => ({
        url: `/layout/admin/edit`,
        method: "PUT",
        body: {
          type,
          image,
          title,
          subTitle,
          faq,
          categories,
        },
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  useCreateLayoutMutation,
  useEditLayoutMutation,
  useGetHeroDataQuery,
} = layoutApi;