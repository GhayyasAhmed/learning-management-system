import { apiSlice } from "../api/apiSlice";

export const courseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Admin: Create Course
    createCourse: builder.mutation({
      query: (data) => ({
        url: "/course/admin/create",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
    }),

    // 2. Admin: Get All Courses
    getAllCourse: builder.query({
      query: () => ({
        url: `/course/admin/all`,
        method: "GET",
        credentials: "include" as const,
      }),
    }),

    // 3. Admin: Delete Course
    deleteCourse: builder.mutation({
      query: (id: string) => ({
        url: `/course/admin/delete`,
        method: "DELETE",
        body: { courseId: id },
        credentials: "include" as const,
      }),
    }),

    // 4. Admin: Edit Course
    editCourse: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/course/admin/edit/${id}`,
        method: "PATCH",
        body: data,
        credentials: "include" as const,
      }),
    }),

    // 5. Public: Get All Courses (Without Purchase/Auth)
    getUsersAllCourses: builder.query({
      query: () => ({
        url: "/course/all",
        method: "GET",
        credentials: "include" as const,
      }),
    }),

    // 6. Public: Get Single Course Details (For Preview Page)
    getCourseDetails: builder.query({
      query: (id: string) => ({
        url: `/course/get/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
    }),

    // 7. Protected: Get Enrolled Course Full Content (Videos, QA, Links)
    getCourseContent: builder.query({
      query: (id: string) => ({
        url: `/course/get/user/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
    }),

    // 8. Protected: Add Question to Video Content
    addNewQuestion: builder.mutation({
      query: ({
        question,
        courseId,
        contentId,
      }: {
        question: string;
        courseId: string;
        contentId: string;
      }) => ({
        url: `/course/add-question`,
        method: "PUT",
        body: { question, courseId, contentId },
        credentials: "include" as const,
      }),
    }),

    // 9. Protected: Add Answer to Question
    addAnswerInQuestion: builder.mutation({
      query: ({
        answer,
        courseId,
        contentId,
        questionId,
      }: {
        answer: string;
        courseId: string;
        contentId: string;
        questionId: string;
      }) => ({
        url: `/course/add-answer`,
        method: "PUT",
        body: { answer, courseId, contentId, questionId },
        credentials: "include" as const,
      }),
    }),

    // 10. Protected: Add Review to Course
    addReviewInCourse: builder.mutation({
      query: ({
        review,
        rating,
        courseId,
      }: {
        review: string;
        rating: number;
        courseId: string;
      }) => ({
        url: `/course/add-review/${courseId}`,
        method: "PUT",
        body: { review, rating },
        credentials: "include" as const,
      }),
    }),

    // 11. Admin: Reply to Review
    addReplyInReview: builder.mutation({
      query: ({
        comment,
        courseId,
        reviewId,
      }: {
        comment: string;
        courseId: string;
        reviewId: string;
      }) => ({
        url: `/course/admin/add-review-reply`,
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
  useAddNewQuestionMutation,
  useAddAnswerInQuestionMutation,
  useAddReviewInCourseMutation,
  useAddReplyInReviewMutation,
} = courseApi;