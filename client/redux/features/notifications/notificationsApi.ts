import { apiSlice } from "../api/apiSlice";

export const notificationApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllNotifications: builder.query({
            query: () => ({
                url: "/notification/admin/all",
                method: "GET",
                credentials: "include" as const,
            }),
        }),
        updateNotificationStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/notification/admin/${id}/status-update`,
                method: "PATCH",
                body: { status },
                credentials: "include" as const,
            }),
        }),
    }),
});

export const {
    useGetAllNotificationsQuery,
    useUpdateNotificationStatusMutation
} = notificationApi;