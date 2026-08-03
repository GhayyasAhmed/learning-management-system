import { useGetHeroDataQuery } from "@/redux/features/layout/layoutApi";
import { useState } from "react";
import { HiMinus, HiPlus } from "react-icons/hi";

export interface IQuestionItem {
  _id: string;
  question: string;
  answer: string;
}

const FAQ = () => {
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const { data } = useGetHeroDataQuery("FAQ");

  // Derive questions directly from query cache
  const questions: IQuestionItem[] = data?.layout?.faq ?? [];

  // Mirrors the visible FAQ content on this page so it stays in sync with
  // Google's FAQPage structured-data guidance (structured data must match
  // what's actually rendered).
  const faqJsonLd =
    questions.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: questions.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: q.answer,
            },
          })),
        }
      : null;

  const toggleQuestion = (id: string) => {
    setActiveQuestion((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <div className="w-[90%] 800px:w-[80%] m-auto">
        {/* <h2 className={`${styles.title} 800px:text-[40px]`}>
          Frequently Asked Questions
        </h2> */}
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
                    aria-expanded={activeQuestion === q._id}
                    aria-controls={`faq-answer-${q._id}`}
                    id={`faq-question-${q._id}`}
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
                  <dd
                    className="mt-2 pr-12"
                    id={`faq-answer-${q._id}`}
                    role="region"
                    aria-labelledby={`faq-question-${q._id}`}
                  >
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
