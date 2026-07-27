export interface INotificationLinkData {
  type?: string;
  courseId?: string;
  contentId?: string;
  questionId?: string;
  reviewId?: string;
}

export const getNotificationLink = (n: INotificationLinkData): string | null => {
  if (!n.courseId) return null;

  switch (n.type) {
    case "question":
    case "question_reply":
      return `/course-access/${n.courseId}?tab=qa${
        n.contentId ? `&contentId=${n.contentId}` : ""
      }`;
    case "review":
    case "review_reply":
      return `/course-access/${n.courseId}?tab=reviews`;
    case "order":
      return `/course-access/${n.courseId}`;
    default:
      return null;
  }
};