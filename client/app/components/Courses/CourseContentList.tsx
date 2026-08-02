import { useState } from "react";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { ICourseContent } from "./CourseContent";

type Props = {
  data: ICourseContent[];
  activeVideo?: number;
  setActiveVideo?: (index: number) => void;
  isDemo?: boolean;
};

const CourseContentList = ({
  data,
  activeVideo,
  setActiveVideo,
  isDemo,
}: Props) => {
  const [visibleSection, setVisibleSection] = useState<Set<string>>(
    new Set<string>()
  );

  // Safely extract unique sections while filtering out undefined
  const videoSection: string[] = [
    ...new Set<string>(
      data
        ?.map((item: ICourseContent) => item.videoSection)
        .filter((section): section is string => Boolean(section))
    ),
  ];

  let totalCount = 0;

  const toggleSection = (section: string) => {
    const newVisibleSection = new Set(visibleSection);
    if (newVisibleSection.has(section)) {
      newVisibleSection.delete(section);
    } else {
      newVisibleSection.add(section);
    }
    setVisibleSection(newVisibleSection);
  };

  return (
    <div
      className={`mt-3.75 w-full ${
        !isDemo ? "-ml-7.5 sticky top-24 left-0 z-30" : ""
      }`}
    >
      {videoSection.map((section: string) => {
        const isSectionVisible = visibleSection.has(section);
        const sectionVideos: ICourseContent[] = (data || []).filter(
          (item: ICourseContent) => item.videoSection === section
        );
        const sectionVideoCount = sectionVideos.length;

        const sectionVideoLength = sectionVideos.reduce(
          (totalLength: number, item: ICourseContent) =>
            totalLength + (item.videoLength || 0),
          0
        );
        const sectionStartIndex: number = totalCount;
        totalCount += sectionVideoCount;
        const sectionContentHours = sectionVideoLength / 60;

        return (
          <div
            className={`${
              !isDemo
                ? "border-b border-[#0000001c] dark:border-[#ffffff8e] pb-2"
                : ""
            }`}
            key={section}
          >
            <div className="w-full flex">
              <div className="w-full flex justify-between items-center">
                <h2 className="text-[22px] text-black dark:text-white">
                  {section}
                </h2>
                <button
                  type="button"
                  className="mr-4 cursor-pointer text-black dark:text-white"
                  aria-expanded={isSectionVisible}
                  aria-label={`${isSectionVisible ? "Collapse" : "Expand"} ${section}`}
                  onClick={() => toggleSection(section)}
                >
                  {isSectionVisible ? (
                    <BsChevronUp size={20} />
                  ) : (
                    <BsChevronDown size={20} />
                  )}
                </button>
              </div>
            </div>
            <h5 className="text-black dark:text-white">
              {sectionVideoCount} Lessons ·{" "}
              {sectionVideoLength < 60
                ? sectionVideoLength
                : sectionContentHours.toFixed(2)}{" "}
              {sectionVideoLength > 60 ? "hours" : "minutes"}
            </h5>
            <br />
            {isSectionVisible && (
              <div className="w-full">
                {sectionVideos.map((item: ICourseContent, index: number) => {
                  const videoIndex: number = sectionStartIndex + index;
                  const itemLength = item.videoLength || 0;
                  const contentLength: number = itemLength / 60;
                  return (
                    <div
                      className={`w-full ${
                        videoIndex === activeVideo ? "bg-slate-800" : ""
                      } cursor-pointer transition-all p-2`}
                      key={item._id}
                      role={!isDemo && setActiveVideo ? "button" : undefined}
                      tabIndex={!isDemo && setActiveVideo ? 0 : undefined}
                      aria-current={
                        videoIndex === activeVideo ? "true" : undefined
                      }
                      onClick={() =>
                        isDemo || !setActiveVideo
                          ? null
                          : setActiveVideo(videoIndex)
                      }
                      onKeyDown={(e) => {
                        if (
                          !isDemo &&
                          setActiveVideo &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          setActiveVideo(videoIndex);
                        }
                      }}
                    >
                      <div className="flex items-start">
                        <div>
                          <MdOutlineOndemandVideo
                            size={25}
                            className="mr-2"
                            color="#1cdada"
                          />
                        </div>
                        <h1 className="text-[18px] inline-block wrap-break-word text-black dark:text-white">
                          {item.title}
                        </h1>
                      </div>
                      <h5 className="pl-8 text-black dark:text-white">
                        {itemLength > 60
                          ? contentLength.toFixed(2)
                          : itemLength}{" "}
                        {itemLength > 60 ? "hours" : "minutes"}
                      </h5>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseContentList;