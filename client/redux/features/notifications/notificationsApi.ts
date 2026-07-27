import { apiSlice } from "../api/apiSlice";

export const notificationApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllNotifications: builder.query({
            query: ({ page = 1, limit = 20, status = "all" }: { page?: number; limit?: number; status?: string } = {}) => ({
                url: `/notification/admin/all?page=${page}&limit=${limit}&status=${status}`,
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
        markAllNotificationsRead: builder.mutation({
            query: () => ({
                url: `/notification/admin/mark-all-read`,
                method: "PATCH",
                credentials: "include" as const,
            }),
        }),
    }),
});

export const {
    useGetAllNotificationsQuery,
    useUpdateNotificationStatusMutation,
    useMarkAllNotificationsReadMutation
} = notificationApi;