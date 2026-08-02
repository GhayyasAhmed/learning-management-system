import { useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineDelete, AiOutlinePlusCircle } from "react-icons/ai";
import { BsLink45Deg, BsPencil } from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { styles } from "../../../styles/styles";

interface ILink {
  title: string;
  url: string;
}

export interface ICourseContentItem {
  videoUrl: string;
  title: string;
  description: string;
  videoLength: string | number;
  videoSection: string;
  links: ILink[];
  suggestion?: string;
}

type Props = {
  active: number;
  setActive: (active: number) => void;
  courseContentData: ICourseContentItem[];
  setCourseContentData: (courseContentData: ICourseContentItem[]) => void;
  handleSubmit: () => void;
};
const CourseContent = ({
  active,
  setActive,
  courseContentData,
  setCourseContentData,
  handleSubmit: handleCourseSubmit,
}: Props) => {


  const [isCollapsed, setIsCollapsed] = useState(
    Array(courseContentData.length).fill(true)
  );
  const [activeSection, setActiveSection] = useState(1);

  // Prevents default form submission behavior
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  // Toggles visibility (expand/collapse)
  const handleCollapseToggle = (index: number) => {
    const updatedCollapsed = [...isCollapsed];
    updatedCollapsed[index] = !updatedCollapsed[index];
    setIsCollapsed(updatedCollapsed);
  };

  // Removes a link
  const handleRemoveLink = (index: number, linkIndex: number) => {
    const updatedData = [...courseContentData];
    updatedData[index].links.splice(linkIndex, 1);
    setCourseContentData(updatedData);
  };

  // Adds a new empty link
  const handleAddLink = (index: number) => {
    const updatedData = [...courseContentData];
    updatedData[index].links.push({ title: "", url: "" });
    setCourseContentData(updatedData);
  };

   const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };


  // Ensures all required fields
  const isContentComplete = (item: ICourseContentItem) =>
    item.title.trim() !== "" &&
    item.description.trim() !== "" &&
    item.videoUrl.trim() !== "" &&
    item.links[0]?.title.trim() !== "" &&
    item.links[0]?.url.trim() !== "" &&
    isValidUrl(item.links[0]?.url.trim());

  const newContentHandler = (item: ICourseContentItem) => {
    if (!isContentComplete(item)) {
      toast.error("Please fill all the fields with a valid link URL.");
    } else {
      let newVideoSection = "";
      if (courseContentData.length > 0) {
        const lastVideoSection =
          courseContentData[courseContentData.length - 1].videoSection;
        if (lastVideoSection) {
          newVideoSection = lastVideoSection;
        }
      }
      const newContent = {
        videoUrl: "",
        title: "",
        description: "",
        videoLength: "",
        videoSection: newVideoSection,
        links: [
          {
            title: "",
            url: "",
          },
        ],
        suggestion: "",
      };
      setCourseContentData([...courseContentData, newContent]);
    }
  };


  // Adds a new video content
  const addNewSection = () => {
    const lastItem = courseContentData[courseContentData.length - 1];
    if (!isContentComplete(lastItem)) {
      toast.error("Please fill all the fields first!");
    } else {
      setActiveSection(activeSection + 1);
      const newContent = {
        videoUrl: "",
        title: "",
        description: "",
        videoLength: "",
        videoSection: `Untitled Section ${activeSection}`,
        links: [{ title: "", url: "" }],
      };
      setCourseContentData([...courseContentData, newContent]);
    }
  };

  const prevButton = () => {
    setActive(active - 1);
  };

  //Making sure that last content isComplete?
  const handleOptions = () => {
    const lastItem = courseContentData[courseContentData.length - 1];
    if (!isContentComplete(lastItem)) {
      toast.error("Section is not completed yet.");
      return;
    } else {
      setActive(active + 1);
      handleCourseSubmit();
    }
  };

  return (
    <div className="w-full 800px:w-[80%] m-auto mt-15 800px:mt-24 p-3">
      <form onSubmit={handleSubmit}>
        {courseContentData?.map((item: ICourseContentItem, index: number) => {
          // Show section input for the first item or when the section changes from the previous item
          const showSectionInput =
            index === 0 ||
            item.videoSection !== courseContentData[index - 1].videoSection;
          return (
            <div
              className={`w-full bg-[#cdc8c817] p-4  ${showSectionInput ? "mt-10" : "mb-0"
                }`}
              key={`content-${index}`}
            >
              {showSectionInput && (
                <>
                  <div className="flex w-full items-center">
                    <input
                      className={`text-[20px] ${item.videoSection === "Untitled Section"
                        ? "w-42.5"
                        : "w-min"
                        } font-Poppins cursor-pointer dark:text-white text-black bg-transparent outline-none`}
                      type="text"
                      onChange={(e) => {
                        const updatedData = courseContentData.map(
                          (content: ICourseContentItem, i: number) => {
                            return i === index
                              ? { ...content, videoSection: e.target.value }
                              : content;
                          }
                        );
                        setCourseContentData(updatedData);
                      }}
                      value={item.videoSection}
                    />
                    <BsPencil className="cursor-pointer dark:text-white text-black" />
                  </div>
                </>
              )}
              <div className="flex w-full items-center justify-between my-0">
                {isCollapsed[index] ? (
                  <>
                    {item.title ? (
                      <p className="font-Poppins dark:text-white text-black">
                        {index + 1}. {item.title}
                      </p>
                    ) : (
                      <div></div>
                    )}
                  </>
                ) : (
                  <div></div>
                )}
                {/* Arrow Button  for collapsed video content*/}
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-label="Delete section"
                    disabled={index === 0}
                    className={`bg-transparent border-0 mr-2 ${
                      index > 0 ? "cursor-pointer" : "cursor-no-drop"
                    }`}
                    onClick={() => {
                      if (index > 0) {
                        const updatedData = [...courseContentData];
                        updatedData.splice(index, 1);
                        setCourseContentData(updatedData);
                      }
                    }}
                  >
                    <AiOutlineDelete className="dark:text-white text-[20px] text-black" />
                  </button>
                  <button
                    type="button"
                    aria-expanded={!isCollapsed[index]}
                    aria-label={isCollapsed[index] ? "Expand content" : "Collapse content"}
                    className="bg-transparent border-0"
                    onClick={() => handleCollapseToggle(index)}
                  >
                    <MdOutlineKeyboardArrowDown
                      fontSize="large"
                      className="dark:text-white text-black"
                      style={{
                        transform: isCollapsed[index]
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* if is collasped is true then we will see all the input fileds */}
              {!isCollapsed[index] && (
                <>
                  <div className="my-3">
                    <label className={styles.label}>Video Title</label>
                    <input
                      type="text"
                      placeholder="Project Plan..."
                      className={`${styles.input}`}
                      value={item.title}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].title = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className={styles.label}>Video Url</label>
                    <input
                      type="text"
                      placeholder=""
                      className={`${styles.input}`}
                      value={item.videoUrl}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].videoUrl = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                  </div>


                  <div className="mb-3">
                    <label className={styles.label}>
                      Video Length (in minutes)
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      className={`${styles.input}`}
                      value={item.videoLength}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].videoLength = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                  </div>


                  <div className="mb-3">
                    <label className={styles.label}>Video Description</label>
                    <textarea
                      rows={8}
                      cols={30}
                      placeholder=""
                      className={`${styles.input} h-min! py-2`}
                      value={item.description}
                      onChange={(e) => {
                        const updatedData = [...courseContentData];
                        updatedData[index].description = e.target.value;
                        setCourseContentData(updatedData);
                      }}
                    />
                    <br />
                  </div>

                  {item.links.map((link: ILink, linkIndex: number) => (
                    <div className="mb-3 block" key={`current-${linkIndex}`}>
                      <div className="w-full flex items-center justify-between">
                        <label className={styles.label}>
                          Link {linkIndex + 1}
                        </label>

                        <button
                          type="button"
                          aria-label="Delete link"
                          disabled={linkIndex === 0}
                          className={`bg-transparent border-0 ${
                            linkIndex === 0 ? "cursor-no-drop" : "cursor-pointer"
                          }`}
                          onClick={() =>
                            linkIndex === 0
                              ? null
                              : handleRemoveLink(index, linkIndex)
                          }
                        >
                          <AiOutlineDelete className="text-black dark:text-white text-[20px]" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="(Link title)"
                        className={`${styles.input}`}
                        value={link.title}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].links[linkIndex].title =
                            e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />
                      <input
                        type="url"
                        placeholder="Source Code Url... (Link URL)"
                        className={`${styles.input} mt-6`}
                        value={link.url}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].links[linkIndex].url =
                            e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />
                    </div>
                  ))}

                  <br />
                  {/* Add new Link */}
                  <div className="inline-block mb-4">
                    <button
                      type="button"
                      className="flex items-center text-[18px] dark:text-white text-black cursor-pointer bg-transparent border-0"
                      onClick={() => handleAddLink(index)}
                    >
                      <BsLink45Deg className="mr-2" /> Add Link
                    </button>
                  </div>
                </>
              )}
              <br />

              {/* add new content */}
              {index === courseContentData.length - 1 && (
                <div>
                  <button
                    type="button"
                    className="flex items-center text-[18px] dark:text-white text-black cursor-pointer bg-transparent border-0"
                    onClick={() => newContentHandler(item)}
                  >
                    <AiOutlinePlusCircle className="mr-2" /> Add New Content
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <br />
        <button
          type="button"
          className="flex items-center text-[20px] dark:text-white text-black cursor-pointer bg-transparent border-0"
          onClick={() => addNewSection()}
        >
          <AiOutlinePlusCircle className="mr-2" /> Add new Section
        </button>
      </form>
      <br />
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          className="w-full 800px:w-45 flex items-center justify-center h-10 bg-[#37a39a] text-center text-white rounded mt-8 m-5 cursor-pointer"
          onClick={() => prevButton()}
        >
          Prev
        </button>
        <button
          type="button"
          className="w-full 800px:w-45 flex items-center justify-center h-10 bg-[#37a39a] text-center text-white rounded mt-8 m-5 cursor-pointer"
          onClick={() => handleOptions()}
        >
          Next
        </button>
      </div>
      <br />
      <br />
      <br />
    </div>
  );
};

export default CourseContent;