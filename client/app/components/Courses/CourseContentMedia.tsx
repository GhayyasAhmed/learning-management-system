import { styles } from "../../styles/styles";
import CoursePlayer from "../../utils/CoursePlayer";
import Ratings from "../../utils/Ratings";
import {
  useAddAnswerInQuestionMutation,
  useAddnewQuestionMutation,
  useAddReplyInReviewMutation,
  useAddReviewInCourseMutation,
  useGetCourseDetailsQuery,
} from "../../../redux/features/courses/courseApi";
import Image from "next/image";
import React, { FC, useEffect, useState, ChangeEvent } from "react";
import toast from "react-hot-toast";
import {
  AiFillStar,
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlineStar,
} from "react-icons/ai";
import { BiMessage } from "react-icons/bi";
import { VscVerifiedFilled } from "react-icons/vsc";
import { getErrorMessage } from "../../utils/getErrorMessage";
import socketIO from "socket.io-client";
import formatTimeAgo from "@/app/utils/formatTimeAgo";

const ENDPOINT =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URI ||
  process.env.NEXT_PUBLIC_SOCKET_URI ||
  "/";
const socket = socketIO(ENDPOINT, { transports: ["websocket"] });

interface UserAvatar {
  url: string;
}

interface User {
  _id: string;
  name: string;
  avatar?: UserAvatar;
  role?: string;
}

interface CourseLink {
  title?: string;
  url: string;
}

interface QuestionReply {
  user: User;
  answer: string;
  createdAt: string;
}

interface Question {
  _id: string;
  user: User;
  question: string;
  createdAt: string;
  questionReplies: QuestionReply[];
}

interface ReviewReply {
  user: User;
  comment: string;
  createdAt: string;
}

interface Review {
  _id: string;
  user: User;
  rating: number;
  comment: string;
  createdAt: string;
  commentReplies?: ReviewReply[];
}

interface CourseContent {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  links: CourseLink[];
  questions: Question[];
}

type Props = {
  data: CourseContent[];
  id: string;
  activeVideo: number;
  user: User;
  setActiveVideo: (activeVideo: number) => void;
  refetch: () => void;
};

// main component
const CourseContentMedia: FC<Props> = ({
  data,
  id,
  activeVideo,
  setActiveVideo,
  user,
  refetch,
}) => {
  const [activeBar, setActiveBar] = useState(0);
  const [question, setQuestion] = useState("");
  const [rating, setRating] = useState(1);
  const [review, setReview] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [isReviewReply, setIsReviewReply] = useState(false);
  const [reply, setReply] = useState("");
  const [reviewId, setReviewId] = useState("");

  // Check if user already reviewed
  const { data: courseData, refetch: courseRefetch } = useGetCourseDetailsQuery(
    id,
    {
      refetchOnMountOrArgChange: true,
    }
  );
  const course = courseData?.course;
  const isReviewsExist = course?.reviews?.find(
    (item: Review) => item.user._id === user._id
  );

  const [
    addAnswerInQuestion,
    {
      isSuccess: answerSuccess,
      error: answerError,
      isLoading: answerCreationLoading,
    },
  ] = useAddAnswerInQuestionMutation({});

  const [
    addnewQuestion,
    { isLoading: questionCreationLoading, isSuccess: questionSuccess, error },
  ] = useAddnewQuestionMutation({});

  const [
    addReviewInCourse,
    {
      isLoading: reviewCreationLoading,
      isSuccess: reviewSuccess,
      error: reviewError,
    },
  ] = useAddReviewInCourseMutation({});

  const [
    addReplyInReview,
    {
      isSuccess: replySuccess,
      isLoading: replyCreationLoading,
      error: replyError,
    },
  ] = useAddReplyInReviewMutation({});

  const handleQuestion = () => {
    if (question.length === 0) {
      toast.error("Question can't be Empty!");
    } else {
      addnewQuestion({
        question,
        courseId: id,
        contentId: data[activeVideo]._id,
      });
    }
  };

  useEffect(() => {
    // Question Response
    if (questionSuccess) {
      refetch();
      toast.success("Question Added Successfully!");
      socket.emit("notification", {
        title: "New Question Received!",
        message: `You Have A New Question In ${data[activeVideo].title}`,
        userId: user?._id,
      });
    }
    if (error) {
      toast.error(
        getErrorMessage(
          error,
          "Could not post your question. Please try again."
        )
      );
    }
    // Answer Response
    if (answerSuccess) {
      refetch();
      toast.success("Answer Added Successfully!");
      if (user.role !== "admin") {
        socket.emit("notification", {
          title: "New Reply Received!",
          message: `You Have A New Question Reply In ${data[activeVideo].title}`,
          userId: user?._id,
        });
      }
    }
    if (answerError) {
      toast.error(
        getErrorMessage(
          answerError,
          "Could not post your answer. Please try again."
        )
      );
    }
    // Review Response
    if (reviewSuccess) {
      courseRefetch();
      toast.success("Review Added Successfully!");
      socket.emit("notification", {
        title: "A New Feedback Received!",
        message: `You Have A New Feedback In ${data[activeVideo].title}`,
        userId: user?._id,
      });
    }
    if (reviewError) {
      toast.error(
        getErrorMessage(
          reviewError,
          "Could not post your review. Please try again."
        )
      );
    }
    // Reply response
    if (replySuccess) {
      courseRefetch();
      toast.success("Reply Added Successfully!");
    }
    if (replyError) {
      toast.error(
        getErrorMessage(
          replyError,
          "Could not post your reply. Please try again."
        )
      );
    }
  }, [
    questionSuccess,
    error,
    answerSuccess,
    answerError,
    reviewSuccess,
    reviewError,
    replyError,
    replySuccess,
    data,
    user._id,
    user.role,
    refetch,
    activeVideo,
    courseRefetch,
  ]);

  const handleAnswerSubmit = () => {
    addAnswerInQuestion({
      answer,
      courseId: id,
      contentId: data[activeVideo]._id,
      questionId,
    });
    setAnswer("");
  };

  const handleReviewSubmit = () => {
    if (review.length === 0) {
      toast.error("Review Can't be Empty!");
    } else {
      addReviewInCourse({ rating, review, courseId: id });
      setReview("");
      setRating(1);
    }
  };

  const handleReviewReplySubmit = () => {
    if (!replyCreationLoading) {
      if (reply === "") {
        toast.error("Reply can't be empty!");
      } else {
        addReplyInReview({ comment: reply, courseId: id, reviewId });
        setReply("");
        setIsReviewReply(false);
        setReviewId("");
      }
    }
  };

  const handleQuestionSubmit = () => {
    handleQuestion();
    setQuestion("");
  };

  return (
    <div className="w-[95%] 800px:w-[86%] py-4 m-auto">
      {/* Video Player */}
      <CoursePlayer
        title={data[activeVideo]?.title}
        videoUrl={data[activeVideo].videoUrl}
      />
      <div className="w-full flex items-center justify-between my-3">
        <div
          className={`${styles.button} text-white w-[unset]! min-h-10! py-[unset]! ${
            activeVideo === 0 && "cursor-no-drop! opacity-[.8]"
          }`}
          onClick={() =>
            setActiveVideo(activeVideo === 0 ? 0 : activeVideo - 1)
          }
        >
          <AiOutlineArrowLeft className="mr-2" />
          Prev Lesson
        </div>
        <div
          className={`${styles.button} w-[unset]! text-white min-h-10! py-[unset]! ${
            data.length - 1 === activeVideo && "cursor-no-drop! opacity-[.8]"
          }`}
          onClick={() =>
            setActiveVideo(
              data && data.length - 1 === activeVideo
                ? activeVideo
                : activeVideo + 1
            )
          }
        >
          Next Lesson
          <AiOutlineArrowRight className="ml-2" />
        </div>
      </div>
      <h1 className="pt-2 text-[25px] font-semibold dark:text-white text-black">
        {data[activeVideo].title}
      </h1>
      <br />
      {/* Tab Navigation */}
      <div className="w-full p-4 flex items-center justify-between bg-slate-500 bg-opacity-20 backdrop-blur shadow-[bg-slate-700] rounded">
        {["Overview", "Resources", "Q&A", "Reviews"].map(
          (item: string, index: number) => (
            <h5
              key={index}
              className={`800px:text-[20px] cursor-pointer ${
                activeBar === index
                  ? "text-red-500"
                  : "dark:text-white text-black"
              }`}
              onClick={() => setActiveBar(index)}
            >
              {item}
            </h5>
          )
        )}
      </div>
      <br />
      {activeBar === 0 && (
        <p className="text-[18px] whitespace-pre-line wrap-break-word mb-3 dark:text-white text-black">
          {data[activeVideo]?.description}
        </p>
      )}
      {/* Resources Links */}
      {activeBar === 1 && (
        <div>
          {data[activeVideo]?.links.map((item: CourseLink, index: number) => (
            <div className="mb-5" key={index}>
              <h2 className="800px:text-[20px] 800px:inline-block dark:text-white text-black">
                {item.title && item.title + " :"}
              </h2>
              <a
                className="inline-block text-[#4395c4] 800px:text-[20px] 800px:pl-2"
                href={item.url}
              >
                {item.url}
              </a>
            </div>
          ))}
        </div>
      )}
      {/* Question Reply */}
      {activeBar === 2 && (
        <>
          <div className="w-full flex">
            <Image
              src={`${
                user.avatar
                  ? user.avatar.url
                  : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
              }`}
              alt=""
              height={50}
              width={50}
              className="w-12.5 h-12.5 rounded-full"
            />
            <textarea
              name=""
              id=""
              value={question}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setQuestion(e.target.value)
              }
              className="outline-none bg-transparent ml-3 border dark:text-white text-black border-[#0000001d] dark:border-[#ffffff57] 800px:w-full p-2 rounded w-[90%] 800px:text-[18px] font-Poppins"
              cols={4}
              rows={5}
              placeholder="Write Your Question..."
            ></textarea>
          </div>
          <div className="w-full flex justify-end">
            <div
              className={`${styles.button} w-30! h-10! text-[18px] mt-5 ${
                questionCreationLoading && `cursor-not-allowed`
              }`}
              onClick={
                questionCreationLoading ? () => {} : handleQuestionSubmit
              }
            >
              Submit
            </div>
          </div>
          <br />
          <br />
          <div className="w-full h-px bg-[#ffffff3b]"></div>
          <div>
            <CommentReply
              data={data}
              activeVideo={activeVideo}
              answer={answer}
              setAnswer={setAnswer}
              handleAnswerSubmit={handleAnswerSubmit}
              user={user}
              questionId={questionId}
              setQuestionId={setQuestionId}
              answerCreationLoading={answerCreationLoading}
            />
          </div>
        </>
      )}
      {/* Review Submission */}
      {activeBar === 3 && (
        <div className="w-full">
          <>
            {!isReviewsExist && (
              <>
                <div className="w-full flex">
                  <Image
                    src={`${
                      user.avatar
                        ? user.avatar.url
                        : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                    }`}
                    alt=""
                    height={50}
                    width={50}
                    className="w-12.5 h-12.5 rounded-full"
                  />
                  <div className="w-full">
                    <h5 className="pl-3 text-[20px] font-medium dark:text-white text-black">
                      Give a Rating <span className="text-red-500">*</span>
                    </h5>
                    <div className="flex w-full ml-2 pb-3">
                      {[1, 2, 3, 4, 5].map((i) =>
                        rating >= i ? (
                          <AiFillStar
                            key={i}
                            className="mr-1 cursor-pointer"
                            color="rgb(246,186,0)"
                            size={25}
                            onClick={() => setRating(i)}
                          />
                        ) : (
                          <AiOutlineStar
                            key={i}
                            className="mr-1 cursor-pointer"
                            color="rgb(246,186,0)"
                            size={25}
                            onClick={() => setRating(i)}
                          />
                        )
                      )}
                    </div>
                    <textarea
                      name=""
                      value={review}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setReview(e.target.value)
                      }
                      id=""
                      cols={20}
                      rows={5}
                      placeholder="Write your comment..."
                      className="outline-none bg-transparent 800px:ml-3 dark:text-white text-black border border-[#00000027] dark:border-[#ffffff57] w-[95%] 800px:w-full p-2 rounded text-[18px] font-Poppins"
                    ></textarea>
                  </div>
                </div>

                <div className="w-full flex justify-end">
                  <div
                    className={`${styles.button} w-30! h-10! text-[18px] mt-5 800px:mr-0 mr-2 ${
                      reviewCreationLoading && "cursor-no-drop"
                    }`}
                    onClick={
                      reviewCreationLoading ? () => {} : handleReviewSubmit
                    }
                  >
                    Submit
                  </div>
                </div>
              </>
            )}
            {/* Reviews list */}
            <br />
            <div className="w-full h-px bg-[#ffffff3b]"></div>
            <div className="w-full">
              {course?.reviews &&
                [...course.reviews]
                  .reverse()
                  .map((item: Review, index: number) => (
                    <div
                      className="w-full my-5 dark:text-white text-black"
                      key={index}
                    >
                      <div className="w-full flex">
                        <div>
                          <Image
                            src={
                              item.user.avatar
                                ? item.user.avatar.url
                                : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                            }
                            width={50}
                            height={50}
                            alt=""
                            className="w-12.5 h-12.5 rounded-full object-cover"
                          />
                        </div>
                        <div className="ml-2">
                          <h1 className="text-[18px]">{item?.user.name}</h1>
                          <Ratings rating={item.rating} />
                          <p>{item.comment}</p>
                          <small className="text-[#0000009e] dark:text-[#ffffff83]">
                            {formatTimeAgo(item.createdAt)} •
                          </small>
                        </div>
                      </div>
                      {user.role === "admin" && (
                        <span
                          className={`${styles.label} ml-10! cursor-pointer`}
                          onClick={() => {
                            setIsReviewReply(true);
                            setReviewId(item._id);
                          }}
                        >
                          Add Reply
                        </span>
                      )}
                      {/* Review Reply */}
                      {isReviewReply && reviewId === item._id && (
                        <div className="w-full flex relative">
                          <input
                            type="text"
                            placeholder="Enter your reply..."
                            value={reply}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setReply(e.target.value)
                            }
                            className="block 800px:ml-12 mt-2 outline-none bg-transparent border-b border-black dark:border-white p-1.25 w-[95%]"
                          />
                          <button
                            type="submit"
                            className="absolute right-0 bottom-1"
                            onClick={handleReviewReplySubmit}
                          >
                            Submit
                          </button>
                        </div>
                      )}
                      {/* Comment Replies */}
                      {(item.commentReplies || []).map(
                        (i: ReviewReply, replyIndex: number) => (
                          <div
                            className="w-full flex 800px:ml-16 my-5"
                            key={replyIndex}
                          >
                            <div className="w-12.5 h-12.5">
                              <Image
                                src={
                                  i.user.avatar
                                    ? i.user.avatar.url
                                    : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                                }
                                width={50}
                                height={50}
                                alt=""
                                className="w-12.5 h-12.5 rounded-full object-cover"
                              />
                            </div>
                            <div className="pl-2">
                              <div className="flex items-center">
                                <h5 className="text-[20px]">{i.user.name}</h5>
                                <VscVerifiedFilled className="text-[#0095F6] ml-2 text-[20px]" />
                              </div>
                              <p>{i.comment}</p>
                              <small className="text-[#ffffff83]">
                                {formatTimeAgo(i.createdAt)} •
                              </small>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ))}
            </div>
          </>
        </div>
      )}
    </div>
  );
};

export default CourseContentMedia;

interface CommentReplyProps {
  data: CourseContent[];
  activeVideo: number;
  answer: string;
  setAnswer: (answer: string) => void;
  handleAnswerSubmit: () => void;
  user: User;
  questionId: string;
  setQuestionId: (id: string) => void;
  answerCreationLoading: boolean;
}

// Comment Reply Wrapper Component
const CommentReply: FC<CommentReplyProps> = ({
  data,
  activeVideo,
  answer,
  setAnswer,
  handleAnswerSubmit,
  questionId,
  setQuestionId,
  answerCreationLoading,
}) => {
  return (
    <div className="w-full my-3">
      {data[activeVideo].questions.map((item: Question, index: number) => (
        <CommentItem
          key={index}
          item={item}
          answer={answer}
          setAnswer={setAnswer}
          questionId={questionId}
          setQuestionId={setQuestionId}
          handleAnswerSubmit={handleAnswerSubmit}
          answerCreationLoading={answerCreationLoading}
        />
      ))}
    </div>
  );
};

interface CommentItemProps {
  item: Question;
  answer: string;
  setAnswer: (answer: string) => void;
  questionId: string;
  setQuestionId: (id: string) => void;
  handleAnswerSubmit: () => void;
  answerCreationLoading: boolean;
}

const CommentItem: FC<CommentItemProps> = ({
  item,
  answer,
  setAnswer,
  questionId,
  setQuestionId,
  handleAnswerSubmit,
  answerCreationLoading,
}) => {
  const [replyActive, setReplyActive] = useState(false);

  return (
    <div className="my-4">
      <div className="flex mb-2">
        <div>
          <Image
            src={
              item.user?.avatar
                ? item.user.avatar.url
                : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
            }
            alt=""
            width={50}
            height={50}
            className="w-12.5 h-12.5 rounded-full object-cover"
          />
        </div>
        <div className="pl-3 dark:text-white text-black">
          <h5 className="text-[20px]">{item?.user?.name}</h5>
          <p>{item?.question}</p>
          <small className="text-[#000000b8] dark:text-[#ffffff83]">
            {!item.createdAt ? "" : formatTimeAgo(item?.createdAt)} •
          </small>
        </div>
      </div>
      <div className="w-full flex">
        <span
          className="800px:pl-16 text-[#000000b8] dark:text-[#ffffff83] cursor-pointer mr-2"
          onClick={() => {
            setReplyActive(!replyActive);
            setQuestionId(item._id);
          }}
        >
          {!replyActive
            ? item.questionReplies.length !== 0
              ? "All Replies"
              : "Add Reply"
            : "Hide Replies"}
        </span>
        <BiMessage
          size={20}
          className="dark:text-[#ffffff83] cursor-pointer text-[#000000b8]"
        />
        <span className="pl-1 -mt-1 cursor-pointer text-[#000000b8] dark:text-[#ffffff83]">
          {item.questionReplies.length}
        </span>
      </div>
      {replyActive && questionId === item._id && (
        <>
          {item?.questionReplies?.map(
            (replyItem: QuestionReply, index: number) => (
              <div
                key={index}
                className="w-full flex 800px:ml-16 my-5 text-black dark:text-white"
              >
                <div>
                  <Image
                    src={
                      replyItem.user?.avatar
                        ? replyItem.user.avatar.url
                        : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                    }
                    alt=""
                    width={50}
                    height={50}
                    className="w-12.5 h-12.5 rounded-full object-cover"
                  />
                </div>
                <div className="pl-2">
                  <div className="flex items-center">
                    <h5 className="text-[20px]">{replyItem.user.name}</h5>
                    {replyItem.user.role === "admin" && (
                      <VscVerifiedFilled className="text-[#0095F6] ml-2 text-[20px]" />
                    )}
                  </div>

                  <p>{replyItem.answer}</p>
                  <small className="text-[#ffffff83]">
                    {formatTimeAgo(replyItem.createdAt)} •
                  </small>
                </div>
              </div>
            )
          )}
          <>
            <div className="w-full flex relative dark:text-white text-black">
              <input
                type="text"
                placeholder="Enter your answer..."
                value={answer}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAnswer(e.target.value)
                }
                className={`block 800px:ml-12 mt-2 outline-none bg-transparent border-b border-[#00000027] dark:text-white text-black dark:border-white p-1.25 w-[95%] ${
                  (answer === "" || answerCreationLoading) &&
                  "cursor-not-allowed"
                }`}
              />
              <button
                type="submit"
                className="absolute right-0 bottom-1"
                onClick={handleAnswerSubmit}
                disabled={answer === "" || answerCreationLoading}
              >
                Submit
              </button>
            </div>
            <br />
          </>
        </>
      )}
    </div>
  );
};