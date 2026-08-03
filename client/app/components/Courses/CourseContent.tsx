import { useEffect, useState } from "react";
import { useGetCourseContentQuery } from "../../../redux/features/courses/courseApi";
import { getErrorMessage } from "../../utils/getErrorMessage";
import Heading from "../../utils/Heading";
import Header from "../Header";
import Loader from "../Loader/Loader";
import CourseContentList from "./CourseContentList";
import CourseContentMedia from "./CourseContentMedia";

export interface IUser {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: {
    public_id?: string;
    url: string;
  };
}

export interface IQuestionReply {
  user: IUser;
  answer: string;
  createdAt: string;
}

export interface IQuestion {
  _id: string;
  user: IUser;
  question: string;
  questionReplies: IQuestionReply[];
  createdAt: string;
}

export interface ICourseLink {
  title?: string;
  url: string;
}

export interface ICourseContent {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  videoThumbnail?: object;
  videoSection?: string;
  videoLength?: number;
  videoPlayer?: string;
  links: ICourseLink[];
  suggestion?: string;
  questions: IQuestion[];
  tags?: string;
}

type Props = {
  id: string;
  user: IUser;
  initialTab?: number;
  initialContentId?: string;
};

const CourseContent = ({ id, user, initialTab, initialContentId }: Props) => {
  const {
    data: contentData,
    isLoading,
    error,
    refetch,
  } = useGetCourseContentQuery(id, { refetchOnMountOrArgChange: true });

  const [activeVideo, setActiveVideo] = useState(0);
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState("Login");

  const data: ICourseContent[] | undefined = contentData?.content;

  useEffect(() => {
    if (initialContentId && Array.isArray(data) && data.length > 0) {
      const idx = data.findIndex((item) => item._id === initialContentId);
      if (idx >= 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveVideo(idx);
        // -- one-time deep-link
        // sync from a notification redirect; data arrives asynchronously after mount so
        // there is no synchronous/render-time way to compute this.
      }
    }
  }, [initialContentId, data]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Header
            open={open}
            setOpen={setOpen}
            route={route}
            setRoute={setRoute}
            activeItem={1}
          />
          {error || !Array.isArray(data) || data.length === 0 ? (
            <div className="w-[92%] 800px:w-[90%] mx-auto py-10">
              <h2 className="text-[20px] font-Poppins text-black dark:text-white">
                Unable to load course content
              </h2>
              <p className="text-[14px] font-Poppins text-black/70 dark:text-white/70 mt-2">
                {error
                  ? getErrorMessage(error, "Please try again.")
                  : "This course doesn't have any content yet."}
              </p>
            </div>
          ) : (
            <div className="w-full grid 800px:grid-cols-10">
              <Heading
                title={data[activeVideo]?.title ?? "Course Content"}
                description="Course content viewer"
                keywords={data[activeVideo]?.tags || ""}
              />
              <div className="col-span-7">
                <CourseContentMedia
                  data={data}
                  id={id}
                  user={user}
                  activeVideo={activeVideo}
                  refetch={refetch}
                  initialTab={initialTab}
                />
              </div>
              <div className="hidden 800px:block 800px:col-span-3">
                <CourseContentList
                  setActiveVideo={setActiveVideo}
                  data={data}
                  activeVideo={activeVideo}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CourseContent;
