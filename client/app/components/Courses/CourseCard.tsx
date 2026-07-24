import Image from "next/image";
import Link from "next/link";
import { AiOutlineUnorderedList } from "react-icons/ai";
import Ratings from "../../utils/Ratings";

export interface ICourseItem {
  _id: string;
  name: string;
  ratings?: number;
  purchased?: number;
  price?: number;
  estimatedPrice?: number;
  thumbnail?: {
    url?: string;
  };
  courseData?: Array<{ _id?: string }>;
}

interface CourseCardPresenterProps {
  item: ICourseItem;
  isProfile?: boolean;
  thumbnailUrl: string;
}

// ---------------------------------------------------------
// Presenter Component: Pure UI Rendering
// ---------------------------------------------------------
export const CourseCardPresenter = ({
  item,
  isProfile,
  thumbnailUrl,
}: CourseCardPresenterProps) => {
  return (
    <Link
      href={!isProfile ? `/course/${item._id}` : `course-access/${item._id}`}
    >
      <div className="w-full min-h-[35vh] dark:bg-slate-500 dark:bg-opacity-20 backdrop-blur border dark:border-[#ffffff1d] border-[#00000015] rounded-lg p-3 shadow-sm dark:shadow-inner">
        <Image
          width={500}
          height={500}
          src={thumbnailUrl}
          style={{ objectFit: "cover" }}
          className="w-125 h-75 rounded"
          alt="thumbnail"
        />
        <br />
        <h1 className="font-Poppins text-[16px] text-black dark:text-white">
          {item.name}
        </h1>
        <div className="w-full flex items-center justify-between pt-2">
          <Ratings rating={item.ratings || 0} />
          <h5
            className={`text-black dark:text-white ${
              isProfile ? "hidden 800px:inline" : ""
            }`}
          >
            {item.purchased || 0} Students
          </h5>
        </div>
        <div className="w-full flex items-center justify-between pt-3">
          <div className="flex">
            <h3 className="text-black dark:text-white">
              {item.price === 0 ? "Free" : `${item.price || 0}$`}
            </h3>
            <h5 className="pl-3 text-[14px] -mt-1.25 line-through opacity-80 text-black dark:text-white">
              {item.estimatedPrice || 0}$
            </h5>
          </div>
          <div className="flex items-center pb-3">
            <AiOutlineUnorderedList size={20} fill="#fff" />
            <h5 className="pl-2 text-black dark:text-white">
              {item.courseData?.length || 0} Lectures
            </h5>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ---------------------------------------------------------
// Container Component: Logic & Fallback Data Processing
// ---------------------------------------------------------
type CourseCardContainerProps = {
  item: ICourseItem;
  isProfile?: boolean;
};

const CourseCard = ({ item, isProfile }: CourseCardContainerProps) => {
  const thumbnailUrl =
    item?.thumbnail?.url ||
    "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png";

  return (
    <CourseCardPresenter
      item={item}
      isProfile={isProfile}
      thumbnailUrl={thumbnailUrl}
    />
  );
};

export default CourseCard;