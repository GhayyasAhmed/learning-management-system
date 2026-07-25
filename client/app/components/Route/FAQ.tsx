import { styles } from "@/app/styles/styles";
import { useGetHeroDataQuery } from "@/redux/features/layout/layoutApi";
import React, { useState } from "react";
import { HiMinus, HiPlus } from "react-icons/hi";

export interface IQuestionItem {
  _id: string;
  question: string;
  answer: string;
}

const FAQ = () => {
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const { data } = useGetHeroDataQuery("FAQ", {
    refetchOnMountOrArgChange: true,
  });

  // Derive questions directly from query cache
  const questions: IQuestionItem[] = data?.layout?.faq ?? [];

  const toggleQuestion = (id: string) => {
    setActiveQuestion((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <div className="w-[90%] 800px:w-[80%] m-auto">
        <h1 className={`${styles.title} 800px:text-[40px]`}>
          Frequently Asked Questions
        </h1>
        <div className="mt-12">
          <div className="space-y-8">
            {questions.map((q: IQuestionItem) => (
              <div
                key={q._id}
                className={`${
                  q._id !== questions[0]?._id && "border-t"
                } border-gray-200 pt-6`}
              >
                <dt className="text-lg">
                  <button
                    type="button"
                    className="flex items-start justify-between w-full text-left focus:outline-none"
                    onClick={() => toggleQuestion(q._id)}
                  >
                    <span className="font-medium text-black dark:text-white">
                      {q.question}
                    </span>
                    <span className="ml-6 shrink-0">
                      {activeQuestion === q._id ? (
                        <HiMinus className="h-6 w-6 text-black dark:text-white" />
                      ) : (
                        <HiPlus className="h-6 w-6 text-black dark:text-white" />
                      )}
                    </span>
                  </button>
                </dt>
                {activeQuestion === q._id && (
                  <dd className="mt-2 pr-12">
                    <br />
                    <p className="text-base font-Poppins text-black dark:text-white">
                      {q.answer}
                    </p>
                  </dd>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <br />
      <br />
      <br />
    </div>
  );
};

export default FAQ;