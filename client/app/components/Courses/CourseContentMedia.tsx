import Image from "next/image";
import { FC, useState } from "react";
import { toast } from "react-hot-toast";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { BiMessage } from "react-icons/bi";
import { VscVerifiedFilled } from "react-icons/vsc";
import SocketIO from "socket.io-client";

import formatTimeAgo from "@/app/utils/formatTimeAgo";
import Ratings from "@/app/utils/Ratings";
import {
  useAddAnswerInQuestionMutation,
  useAddNewQuestionMutation,
  useAddReplyInReviewMutation,
  useAddReviewInCourseMutation,
  useGetCourseDetailsQuery,
} from "@/redux/features/courses/courseApi";
import CoursePlayer from "@/app/utils/CoursePlayer";

const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "";
const socket = SocketIO(ENDPOINT, { transports: ["websocket"] });

// --- TypeScript Interfaces ---

export interface User {
  _id: string;
  name: string;
  avatar?: {
    url: string;
  };
  role?: string;
}

export interface ReviewReply {
  _id?: string;
  user: User;
  comment: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  user: User | string;
  rating: number;
  review: string;
  createdAt: string;
  reviewReplies?: ReviewReply[];
}

export interface QuestionReply {
  _id?: string;
  user: User;
  answer: string;
  createdAt: string;
}

export interface Question {
  _id: string;
  user: User;
  question: string;
  createdAt: string;
  questionReplies?: QuestionReply[];
}

export interface CourseLink {
  title?: string;
  url: string;
}

export interface CourseContentItem {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  videoSection?: string;
  links: CourseLink[];
  suggestion?: string;
  questions: Question[];
}

export interface Props {
  id: string;
  user: User;
  activeVideo: number;
  data: CourseContentItem[];
  refetch: () => void;
  initialTab?: number;
}

export interface CustomError {
  data?: {
    message?: string;
  };
}

// --- Helper Component to Render User Name ---

interface UserNameBadgeProps {
  userObj?: User | null;
  currentUserRole?: string;
}

const UserNameBadge: FC<UserNameBadgeProps> = ({
  userObj,
  currentUserRole,
}) => {
  const isDeleted = !userObj || !userObj.name;

  if (isDeleted) {
    if (currentUserRole === "admin") {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium italic text-red-500 dark:text-red-400">
          Deleted User
          <span className="text-[10px] font-sans font-normal not-italic px-1.5 py-0.5 rounded bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 uppercase tracking-wider">
            Deleted
          </span>
        </span>
      );
    }
    return (
      <span className="text-gray-500 dark:text-gray-400 italic">
        Anonymous User
      </span>
    );
  }

  return <span>{userObj.name}</span>;
};

// --- Main Component ---

const CourseContentMedia: FC<Props> = ({
  id,
  user,
  activeVideo,
  data,
  refetch,
  initialTab,
}) => {
  const [active, setActive] = useState<number>(initialTab ?? 0);
  const [question, setQuestion] = useState<string>("");
  const [rating, setRating] = useState<number>(1);
  const [review, setReview] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [questionId, setQuestionId] = useState<string>("");
  const [isReviewReply, setIsReviewReply] = useState<boolean>(false);
  const [reply, setReply] = useState<string>("");
  const [reviewId, setReviewId] = useState<string>("");

  // RTK Query hooks
  const [addNewQuestion, { isLoading: questionLoading }] =
    useAddNewQuestionMutation();

  const [addAnswerInQuestion, { isLoading: answerLoading }] =
    useAddAnswerInQuestionMutation();

  const { data: courseData, refetch: courseRefetch } = useGetCourseDetailsQuery(
    id,
    { refetchOnMountOrArgChange: true },
  );

  const [addReviewInCourse, { isLoading: reviewLoading }] =
    useAddReviewInCourseMutation();

  const [addReplyInReview, { isLoading: replyLoading }] =
    useAddReplyInReviewMutation();

  const course = courseData?.course;

  // Check if active user already reviewed this course
  const isReviewed = course?.reviews?.some((item: Review) => {
    const reviewUserId =
      typeof item.user === "object" ? item.user?._id : item.user;
    return reviewUserId === user?._id;
  });

  // Handle Question submission
  const handleQuestionSubmit = async () => {
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      toast.error("Question cannot be empty!");
      return;
    }
    if (questionLoading) return;

    try {
      await addNewQuestion({
        question: trimmedQuestion,
        courseId: id,
        contentId: data[activeVideo]?._id,
      }).unwrap();

      setQuestion("");
      refetch();
      toast.success("Question added successfully!");
      socket?.emit("notification", {
        title: "New Question Received",
        message: `You have a new question in ${data[activeVideo]?.title}`,
        userId: user?._id,
      });
    } catch (error: unknown) {
      const err = error as CustomError;
      toast.error(err?.data?.message || "Failed to add question");
    }
  };

  // Handle Answer submission
  const handleAnswerSubmit = async () => {
    const trimmedAnswer = answer.trim();
    if (trimmedAnswer.length === 0) {
      toast.error("Answer cannot be empty!");
      return;
    }
    if (answerLoading) return;

    try {
      await addAnswerInQuestion({
        answer: trimmedAnswer,
        courseId: id,
        contentId: data[activeVideo]?._id,
        questionId,
      }).unwrap();

      setAnswer("");
      setQuestionId("");
      refetch();
      toast.success("Answer added successfully!");

      if (user?.role !== "admin") {
        socket?.emit("notification", {
          title: "New Reply Received",
          message: `You have a new question reply in ${data[activeVideo]?.title}`,
          userId: user?._id,
        });
      }
    } catch (error: unknown) {
      const err = error as CustomError;
      toast.error(err?.data?.message || "Failed to add answer");
    }
  };

  // Handle Review Submission
  const handleReviewSubmit = async () => {
    const trimmedReview = review.trim();
    if (trimmedReview.length === 0) {
      toast.error("Review cannot be empty!");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5.");
      return;
    }
    if (reviewLoading) return;

    try {
      await addReviewInCourse({
        review: trimmedReview,
        rating,
        courseId: id,
      }).unwrap();

      setReview("");
      setRating(1);
      courseRefetch();
      toast.success("Review added successfully!");
      socket?.emit("notification", {
        title: "New Review Received",
        message: `You have a new review in ${data[activeVideo]?.title}`,
        userId: user?._id,
      });
    } catch (error: unknown) {
      const err = error as CustomError;
      toast.error(err?.data?.message || "Failed to add review");
    }
  };

  const handleReviewReplySubmit = async () => {
    const trimmedReply = reply.trim();
    if (trimmedReply.length === 0) {
      toast.error("Reply cannot be empty!");
      return;
    }
    if (replyLoading) return;

    try {
      await addReplyInReview({
        comment: trimmedReply,
        courseId: id,
        reviewId,
      }).unwrap();

      setReply("");
      setIsReviewReply(false);
      setReviewId("");
      courseRefetch();
      toast.success("Reply added successfully!");
    } catch (error: unknown) {
      const err = error as CustomError;
      toast.error(err?.data?.message || "Failed to add reply");
    }
  };

  return (
    <div className="w-[95%] 800px:w-[92%] m-auto py-5">
      <CoursePlayer
        title={data[activeVideo]?.title}
        videoUrl={data[activeVideo]?.videoUrl}
      />
      <div
        className="w-full flex items-center justify-between bg-[#1e1e2d] p-4 rounded-md shadow"
        role="tablist"
        aria-label="Course content sections"
      >
        {["Overview", "Resources", "Q&A", "Reviews"].map((text, index) => (
          <button
            key={text}
            type="button"
            role="tab"
            id={`tab-${index}`}
            aria-selected={active === index}
            aria-controls={`tabpanel-${index}`}
            className={`cursor-pointer font-Poppins bg-transparent border-0 ${
              active === index
                ? "text-red-500 font-semibold"
                : "dark:text-white text-black"
            }`}
            onClick={() => setActive(index)}
          >
            {text}
          </button>
        ))}
      </div>

      {/* Tab 0: Overview */}
      {active === 0 && (
        <div
          className="my-5 text-white"
          role="tabpanel"
          id="tabpanel-0"
          aria-labelledby="tab-0"
        >
          <p className="text-[18px] whitespace-pre-line leading-8">
            {data[activeVideo]?.description ||
              "No description provided for this lesson."}
          </p>
        </div>
      )}

      {/* Tab 1: Resources */}
      {active === 1 && (
        <div
          className="my-5"
          role="tabpanel"
          id="tabpanel-1"
          aria-labelledby="tab-1"
        >
          {data[activeVideo]?.links?.map((item: CourseLink, index: number) => (
            <div className="mb-5" key={index}>
              <h2 className="800px:text-[20px] text-[16px] dark:text-white text-black">
                {item.title && `${item.title} :`}
              </h2>
              <a
                className="inline-block text-[#4395c4] 800px:text-[20px] text-[16px] underline"
                href={item.url}
                target="_blank"
                rel="noreferrer"
              >
                {item.url}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Q&A */}
      {active === 2 && (
        <>
          <div
            // className="flex w-full my-5"
            role="tabpanel"
            id="tabpanel-2"
            aria-labelledby="tab-2"
          >
            <Image
              src={
                user?.avatar?.url
                  ? user.avatar.url
                  : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
              }
              width={50}
              height={50}
              alt={user?.name || "User Avatar"}
              className="w-12.5 h-12.5 rounded-full object-cover"
            />
            <textarea
              name=""
              id=""
              cols={40}
              rows={5}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Write your question..."
              className="outline-none bg-transparent ml-3 border dark:border-[#ffffff3b] border-[#0000003b] 800px:w-full p-2 rounded w-[90%] 800px:text-[18px] font-Poppins"
            />
          </div>
          <div className="w-full flex justify-end">
            <button
              disabled={questionLoading || !question.trim()}
              className={`font-Poppins px-6 py-2 rounded text-white bg-[#37a39a] ${
                questionLoading || !question.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              onClick={handleQuestionSubmit}
            >
              {questionLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
          <br />
          <br />
          <div className="w-full h-px bg-[#ffffff3b]"></div>
          {data[activeVideo]?.questions?.length === 0 && (
            <p className="text-black dark:text-white opacity-70 py-4 font-Poppins">
              No questions yet. Be the first to ask!
            </p>
          )}
          <div>
            <CommentReply
              data={data}
              activeVideo={activeVideo}
              answer={answer}
              setAnswer={setAnswer}
              handleAnswerSubmit={handleAnswerSubmit}
              questionId={questionId}
              setQuestionId={setQuestionId}
              answerLoading={answerLoading}
              user={user}
            />
          </div>
        </>
      )}

      {/* Tab 3: Reviews */}
      {active === 3 && (
        <div
          className="w-full my-5"
          role="tabpanel"
          id="tabpanel-3"
          aria-labelledby="tab-3"
        >
          {!isReviewed && (
            <>
              <div className="flex w-full">
                <Image
                  src={
                    user?.avatar?.url
                      ? user.avatar.url
                      : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                  }
                  width={50}
                  height={50}
                  alt={user?.name || "User Avatar"}
                  className="w-12.5 h-12.5 rounded-full object-cover"
                />
                <div className="w-full ml-3">
                  <h5 className="text-[20px] font-Poppins dark:text-white text-black">
                    Give a Rating <span className="text-red-500">*</span>
                  </h5>
                  <div className="flex w-full ml-2 pb-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
                        aria-pressed={rating === i}
                        className="mr-1 bg-transparent border-0 p-0"
                        onClick={() => setRating(i)}
                      >
                        {rating >= i ? (
                          <AiFillStar
                            color="rgb(246,186,0)"
                            size={25}
                            aria-hidden="true"
                          />
                        ) : (
                          <AiOutlineStar
                            color="rgb(246,186,0)"
                            size={25}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <textarea
                    name=""
                    id=""
                    cols={40}
                    rows={5}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write your review..."
                    className="outline-none bg-transparent border dark:border-[#ffffff3b] border-[#0000003b] w-full p-2 rounded 800px:text-[18px] font-Poppins"
                  />
                </div>
              </div>
              <div className="w-full flex justify-end mt-2">
                <button
                  disabled={reviewLoading || !review.trim()}
                  className={`font-Poppins px-6 py-2 rounded text-white bg-[#37a39a] ${
                    reviewLoading || !review.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={handleReviewSubmit}
                >
                  {reviewLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </>
          )}

          <br />
          <div className="w-full h-px bg-[#ffffff3b]"></div>

          {/* Render Course Reviews */}
          <div className="w-full">
            {(!course?.reviews || course.reviews.length === 0) && (
              <p className="text-black dark:text-white opacity-70 py-4 font-Poppins">
                No reviews yet.
              </p>
            )}
            {(course?.reviews && [...course.reviews].reverse())?.map(
              (item: Review, index: number) => {
                const isUserObj =
                  typeof item.user === "object" && item.user !== null;
                const reviewUser = isUserObj ? (item.user as User) : null;
                const userAvatar = reviewUser?.avatar?.url;

                return (
                  <div
                    className="w-full my-5 dark:text-white text-black"
                    key={item._id || index}
                  >
                    <div className="w-full flex">
                      <Image
                        src={
                          userAvatar
                            ? userAvatar
                            : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                        }
                        width={50}
                        height={50}
                        alt="User Avatar"
                        className="w-12.5 h-12.5 rounded-full object-cover"
                      />
                      <div className="ml-3">
                        <h1 className="text-[18px] flex items-center">
                          <UserNameBadge
                            userObj={reviewUser}
                            currentUserRole={user?.role}
                          />
                        </h1>
                        <Ratings rating={item.rating} />
                        <p className="mt-1">{item.review}</p>
                        <small className="text-[#000000b8] dark:text-[#ffffff83]">
                          {item.createdAt ? formatTimeAgo(item.createdAt) : ""}
                        </small>
                      </div>
                    </div>

                    {/* Admin Reply Action Button */}
                    {user?.role === "admin" && (
                      <div className="w-full flex justify-end">
                        <button
                          type="button"
                          className="text-[14px] cursor-pointer text-[#37a39a] flex items-center bg-transparent border-0"
                          aria-expanded={isReviewReply && reviewId === item._id}
                          onClick={() => {
                            setIsReviewReply(!isReviewReply);
                            setReviewId(item._id);
                          }}
                        >
                          <BiMessage size={18} className="mr-1" />
                          Reply
                        </button>
                      </div>
                    )}

                    {/* Admin Reply Input Box */}
                    {isReviewReply && reviewId === item._id && (
                      <div className="w-full flex my-3">
                        <input
                          type="text"
                          placeholder="Write a reply..."
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          className="border-b border-[#0000003b] dark:border-[#ffffff3b] bg-transparent outline-none p-1 w-full"
                        />
                        <button
                          disabled={replyLoading || !reply.trim()}
                          className={`ml-2 px-4 py-1 bg-[#37a39a] text-white rounded ${
                            replyLoading || !reply.trim()
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={handleReviewReplySubmit}
                        >
                          {replyLoading ? "Posting..." : "Post"}
                        </button>
                      </div>
                    )}

                    {/* Render Comment Replies */}
                    {item.reviewReplies?.map(
                      (replyItem: ReviewReply, rIndex: number) => (
                        <div
                          className="w-full flex md:ml-12 ml-6 my-4 border-l-2 border-[#37a39a] pl-3"
                          key={replyItem._id || rIndex}
                        >
                          <Image
                            src={
                              replyItem.user?.avatar?.url
                                ? replyItem.user.avatar.url
                                : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                            }
                            width={40}
                            height={40}
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="ml-3">
                            <h5 className="text-[16px] flex items-center">
                              <UserNameBadge
                                userObj={replyItem.user}
                                currentUserRole={user?.role}
                              />
                              <VscVerifiedFilled className="text-[#0095f6] ml-1 text-[16px]" />
                            </h5>
                            <p>{replyItem.comment}</p>
                            <small className="text-[#000000b8] dark:text-[#ffffff83]">
                              {replyItem.createdAt
                                ? formatTimeAgo(replyItem.createdAt)
                                : ""}
                            </small>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Child Component for Q&A ---

interface CommentReplyProps {
  data: CourseContentItem[];
  activeVideo: number;
  answer: string;
  setAnswer: (answer: string) => void;
  handleAnswerSubmit: () => void;
  questionId: string;
  setQuestionId: (id: string) => void;
  answerLoading: boolean;
  user: User;
}

const CommentReply: FC<CommentReplyProps> = ({
  data,
  activeVideo,
  answer,
  setAnswer,
  handleAnswerSubmit,
  questionId,
  setQuestionId,
  answerLoading,
  user,
}) => {
  return (
    <div className="w-full my-3">
      {data[activeVideo]?.questions?.map((item: Question, index: number) => (
        <CommentItem
          key={item._id || index}
          item={item}
          answer={answer}
          setAnswer={setAnswer}
          handleAnswerSubmit={handleAnswerSubmit}
          questionId={questionId}
          setQuestionId={setQuestionId}
          answerLoading={answerLoading}
          user={user}
        />
      ))}
    </div>
  );
};

interface CommentItemProps {
  item: Question;
  answer: string;
  setAnswer: (answer: string) => void;
  handleAnswerSubmit: () => void;
  questionId: string;
  setQuestionId: (id: string) => void;
  answerLoading: boolean;
  user: User;
}

const CommentItem: FC<CommentItemProps> = ({
  item,
  answer,
  setAnswer,
  handleAnswerSubmit,
  questionId,
  setQuestionId,
  answerLoading,
  user,
}) => {
  const [replyActive, setReplyActive] = useState<boolean>(false);
  const repliesCount = (item.questionReplies || []).length;

  return (
    <div className="my-4">
      <div className="flex mb-2">
        <Image
          src={
            item.user?.avatar?.url
              ? item.user.avatar.url
              : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
          }
          width={50}
          height={50}
          alt="User Avatar"
          className="w-12.5 h-12.5 rounded-full object-cover"
        />
        <div className="pl-3 dark:text-white text-black">
          <h5 className="text-[20px] font-Poppins flex items-center">
            <UserNameBadge userObj={item.user} currentUserRole={user?.role} />
          </h5>
          <p>{item.question}</p>
          <small className="text-[#000000b8] dark:text-[#ffffff83]">
            {item.createdAt ? formatTimeAgo(item.createdAt) : ""}
          </small>
        </div>
      </div>

      <div className="w-full flex items-center">
        <button
          type="button"
          className="800px:pl-16 text-[#000000b8] dark:text-[#ffffff83] cursor-pointer mr-2 flex items-center bg-transparent border-0"
          aria-expanded={replyActive && questionId === item._id}
          onClick={() => {
            setReplyActive(!replyActive);
            setQuestionId(item._id);
          }}
        >
          {!replyActive ? (
            repliesCount === 0 ? (
              <>
                <BiMessage size={20} className="mr-1" /> Add Reply
              </>
            ) : (
              <>
                <BiMessage size={20} className="mr-1" /> All Replies (
                {repliesCount})
              </>
            )
          ) : (
            "Hide Replies"
          )}
        </button>
      </div>

      {replyActive && questionId === item._id && (
        <div className="w-full">
          {item.questionReplies?.map(
            (replyItem: QuestionReply, rIndex: number) => (
              <div
                className="w-full flex md:ml-16 ml-8 my-5 text-black dark:text-white border-l-2 border-[#37a39a] pl-3"
                key={replyItem._id || rIndex}
              >
                <Image
                  src={
                    replyItem.user?.avatar?.url
                      ? replyItem.user.avatar.url
                      : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                  }
                  width={40}
                  height={40}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="pl-3">
                  <div className="flex items-center">
                    <h5 className="text-[20px] flex items-center">
                      <UserNameBadge
                        userObj={replyItem.user}
                        currentUserRole={user?.role}
                      />
                    </h5>
                    {replyItem.user?.role === "admin" && (
                      <VscVerifiedFilled className="text-[#0095f6] ml-2 text-[20px]" />
                    )}
                  </div>
                  <p>{replyItem.answer}</p>
                  <small className="text-[#000000b8] dark:text-[#ffffff83]">
                    {replyItem.createdAt
                      ? formatTimeAgo(replyItem.createdAt)
                      : ""}
                  </small>
                </div>
              </div>
            ),
          )}

          <div className="w-full flex relative md:ml-16 ml-8 my-3">
            <input
              type="text"
              placeholder="Enter your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="outline-none bg-transparent border-b border-[#0000003b] dark:border-[#ffffff3b] w-[80%] p-1"
            />
            <button
              type="submit"
              disabled={answerLoading || !answer.trim()}
              className={`ml-2 px-4 py-1 bg-[#37a39a] text-white rounded ${
                answerLoading || !answer.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              onClick={handleAnswerSubmit}
            >
              {answerLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContentMedia;
