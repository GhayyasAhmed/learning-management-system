"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineDelete } from "react-icons/ai";
import { HiMinus, HiPlus } from "react-icons/hi";
import { IoMdAddCircleOutline } from "react-icons/io";
import { styles } from "../../../../app/styles/styles";
import {
  useEditLayoutMutation,
  useGetHeroDataQuery,
} from "../../../../redux/features/layout/layoutApi";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import Loader from "../../Loader/Loader";

export interface IFaqItem {
  _id?: string;
  question: string;
  answer: string;
  active?: boolean;
}

interface EditFaqFormProps {
  initialFaq: IFaqItem[];
  refetch: () => void;
}

// ---------------------------------------------------------
// Form Component: Handles Local State & FAQ Operations
// ---------------------------------------------------------
const EditFaqForm = ({ initialFaq, refetch }: EditFaqFormProps) => {
  const [editLayout, { isLoading, isSuccess: layoutSuccess, error }] =
    useEditLayoutMutation();

  const [questions, setQuestions] = useState<IFaqItem[]>(initialFaq);

  useEffect(() => {
    if (layoutSuccess) {
      refetch();
      toast.success("FAQ updated successfully!");
    }
    if (error) {
      toast.error(
        getErrorMessage(error, "Could not update the FAQ. Please try again."),
      );
    }
  }, [layoutSuccess, error, refetch]);

  // Toggle question collapse state
  const toggleQuestion = (id?: string) => {
    if (!id) return;
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q._id === id ? { ...q, active: !q.active } : q,
      ),
    );
  };

  // Update question text
  const handleQuestionChange = (id: string | undefined, value: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q._id === id ? { ...q, question: value } : q)),
    );
  };

  // Update answer text
  const handleAnswerChange = (id: string | undefined, value: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q._id === id ? { ...q, answer: value } : q)),
    );
  };

  // Add new empty FAQ item
  const newFaqHandler = () => {
    setQuestions((prevQuestions) => [
      ...prevQuestions,
      {
        _id: Date.now().toString(),
        question: "",
        answer: "",
        active: true,
      },
    ]);
  };

  const areQuestionsUnchanged = (
    originalQuestions: IFaqItem[],
    newQuestions: IFaqItem[],
  ) => {
    return JSON.stringify(originalQuestions) === JSON.stringify(newQuestions);
  };

  const isAnyQuestionEmpty = (faqList: IFaqItem[]) => {
    return faqList.some(
      (q) => q.question.trim() === "" || q.answer.trim() === "",
    );
  };

  const isDisabled =
    areQuestionsUnchanged(initialFaq, questions) ||
    isAnyQuestionEmpty(questions);

  const handleEdit = async () => {
    if (!isDisabled) {
      // Sanitize payload: strip temporary/mock IDs created via Date.now()
      const sanitizedFaq = questions.map(({ _id, question, answer }) => {
        // If _id is not a valid 24-char ObjectId, exclude it so Mongo auto-generates a real one
        const isRealObjectId = _id && /^[0-9a-fA-F]{24}$/.test(_id);
        return {
          ...(isRealObjectId ? { _id } : {}),
          question,
          answer,
        };
      });

      await editLayout({
        type: "FAQ",
        faq: sanitizedFaq,
      });
    }
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-[90%] 800px:w-[80%] m-auto mt-30">
          <div className="mt-12">
            <dl className="space-y-8">
              {questions?.map((q) => (
                <div
                  key={q._id ?? q.question}
                  className={`${
                    q._id !== questions[0]?._id && "border-t"
                  } border-gray-200 pt-6`}
                >
                  <dt className="text-lg">
                    <button
                      type="button"
                      className="flex items-start dark:text-white text-black justify-between w-full text-left focus:outline-none"
                      onClick={() => toggleQuestion(q._id)}
                    >
                      <input
                        className={`${styles.input} border-none`}
                        value={q.question}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleQuestionChange(q._id, e.target.value)
                        }
                        placeholder="Add your question..."
                      />

                      <span className="ml-6 shrink-0">
                        {q.active ? (
                          <HiMinus className="h-6 w-6" />
                        ) : (
                          <HiPlus className="h-6 w-6" />
                        )}
                      </span>
                    </button>
                  </dt>
                  {q.active && (
                    <dd className="mt-2 pr-12 flex items-center justify-between">
                      <input
                        className={`${styles.input} border-none`}
                        value={q.answer}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleAnswerChange(q._id, e.target.value)
                        }
                        placeholder="Add your answer..."
                      />
                      <span className="ml-6 shrink-0">
                        <AiOutlineDelete
                          className="dark:text-white text-black text-[18px] cursor-pointer"
                          onClick={() => {
                            setQuestions((prevQuestions) =>
                              prevQuestions.filter(
                                (item) => item._id !== q._id,
                              ),
                            );
                          }}
                        />
                      </span>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
            <br />
            <br />
            <IoMdAddCircleOutline
              className="dark:text-white text-black text-[25px] cursor-pointer"
              onClick={newFaqHandler}
            />
          </div>
          <button
            type="button"
            disabled={isDisabled}
            onClick={handleEdit}
            className={`${
              styles.button
            } w-25! min-h-10! h-10! dark:text-white text-black bg-[#cccccc34] ${
              isDisabled
                ? "cursor-not-allowed!"
                : "cursor-pointer! bg-[#42d383]!"
            } rounded! fixed bottom-12 right-12`}
          >
            Save
          </button>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------
// Container Component: Handles Data Fetching & Key Re-initialization
// ---------------------------------------------------------
const EditFaq = () => {
  const { data, isLoading, refetch } = useGetHeroDataQuery("FAQ", {
    refetchOnMountOrArgChange: true,
  });

  if (isLoading) {
    return <Loader />;
  }

  const faqData: IFaqItem[] = data?.layout?.faq || [];
  // Use data length/signature as key to reset local state when fresh data arrives
  const key = faqData.map((f) => f._id).join("-") || "empty";

  return <EditFaqForm key={key} initialFaq={faqData} refetch={refetch} />;
};

export default EditFaq;
