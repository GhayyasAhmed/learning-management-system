import { apiSlice } from "../api/apiSlice";
export const courseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: (data) => ({
        url: "/course/admin/create",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
    }),
    
    getAllCourse: builder.query({
      query: () => ({
        url: `/course/admin/all`,
        method: "GET",
        credentials: "include" as const,
      }),
    }),

    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/course/admin/delete`,
        method: "DELETE",
        body: {courseId: id},
        credentials: "include" as const,
      }),
    }),
    
    editCourse: builder.mutation({
      query: ({ id, data }) => ({
        url: `/course/edit/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
    }),

    getUsersAllCourses: builder.query({
      query: () => ({
        url: "/course/get/all",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    
    getCourseDetails: builder.query({
      query: (id) => ({
        url: `/course/get/user/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
    }),

    getCourseContent: builder.query({
      query: (arg) => {
        // Backwards compatible: allow calling with just `id` (string)
        const id = typeof arg === "string" ? arg : arg?.id;
        const userId = typeof arg === "string" ? undefined : arg?.userId;
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
        return {
          url: `/course/get/${id}${qs}`,
          method: "GET",
          credentials: "include" as const,
        };
      },
    }),
    
    addnewQuestion: builder.mutation({
      query: ({ question, courseId, contentId }) => ({
        url: `/course/add-question`,
        method: "PUT",
        body: { question, courseId, contentId },
        credentials: "include" as const,
      }),
    }),
    addAnswerInQuestion: builder.mutation({
      query: ({ answer, courseId, contentId, questionId }) => ({
        url: `/course/add-answer`,
        method: "PUT",
        body: { answer, courseId, contentId, questionId },
        credentials: "include" as const,
      }),
    }),
    addReviewInCourse: builder.mutation({
      query: ({ review, rating, courseId }) => ({
        url: `/course/add-review/${courseId}`,
        method: `PUT`,
        body: { review, rating },
        credentials: "include" as const,
      }),
    }),
    addReplyInReview: builder.mutation({
      query: ({ comment, courseId, reviewId }) => ({
        // server route is "/add-reply/:id" (admin only); controller reads courseId from body
        url: `/course/add-review-reply`,
        method: "PUT",
        body: { comment, courseId, reviewId },
        credentials: "include" as const,
      }),
    }),
  }),
});
export const {
  useCreateCourseMutation,
  useGetAllCourseQuery,
  useDeleteCourseMutation,
  useEditCourseMutation,
  useGetUsersAllCoursesQuery,
  useGetCourseDetailsQuery,
  useGetCourseContentQuery,
  useAddnewQuestionMutation,
  useAddAnswerInQuestionMutation,
  useAddReviewInCourseMutation,
  useAddReplyInReviewMutation,
} = courseApi;