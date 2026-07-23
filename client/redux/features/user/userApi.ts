import { apiSlice } from "../api/apiSlice";


export const userApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        updateAvatar: builder.mutation({
            query: (avatar) => ({
                url: "/user/me/update/profile-picture",
                method: "PUT",
                body: avatar,
                credentials: "include",
            }),
        }),

        editProfile: builder.mutation({
            query: ({ name }) => ({
                url: "/user/me/update",
                method: "PATCH",
                body: { name },
                credentials: "include",
            }),
        }),

        updatePassword: builder.mutation({
            query: ({ newPassword, oldPassword, confirmPassword }) => ({
                url: "/user/password/update",
                method: "PUT",
                body: { newPassword, oldPassword, confirmPassword },
                credentials: "include",
            }),
        }),

        getAllUsers: builder.query({
            query: () => ({
                url: "/user/admin/all",
                method: "GET",
                credentials: "include",
            }),
        }),

        updateUserRole: builder.mutation({
            query: ({ id, role }) => ({
                url: "/user/admin/update-role",
                method: "PUT",
                body: { userId:id, role },
                credentials: "include" as const,
            }),
        }),

        deleteUser: builder.mutation({
            query: (id) => ({
                url: `delete-user/${id}`,
                method: "DELETE",
                credentials: "include" as const,
            }),
        }),
    })
})

export const { useUpdateAvatarMutation, useEditProfileMutation, useUpdatePasswordMutation, useGetAllUsersQuery, useUpdateUserRoleMutation, useDeleteUserMutation } = userApi;