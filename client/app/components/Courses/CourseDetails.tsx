import formatTimeAgo from "@/app/utils/formatTimeAgo";
import { Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Image from "next/image";
import Link from "next/link";
import { FC, Dispatch, SetStateAction, useState } from "react";
import { IoCheckmarkDoneOutline, IoCloseOutline } from "react-icons/io5";
import { VscVerifiedFilled } from "react-icons/vsc";
import { useSelector } from "react-redux";
import { useLoadUserQuery } from "../../../redux/features/api/apiSlice";
import { styles } from "../../styles/styles";
import CoursePlayer from "../../utils/CoursePlayer";
import Ratings from "../../utils/Ratings";
import CheckOutForm from "../Payment/CheckOutForm";
import CourseContentList from "./CourseContentList";
import { ICourseContent } from "./CourseContent";

export interface ICourseBenefit {
  title: string;
}

export interface ICoursePrerequisite {
  title: string;
}

export interface ICourseReviewReply {
  user: {
    name: string;
    avatar?: {
      url: string;
    };
  };
  comment: string;
  createdAt: string;
}

export interface ICourseReview {
  user: {
    name: string;
    avatar?: {
      url: string;
    };
  };
  rating: number;
  comment: string;
  createdAt: string;
  commentReplies: ICourseReviewReply[];
}

export interface ICourseDetailsData {
  _id: string;
  name: string;
  title?: string;
  description: string;
  price: number;
  estimatedPrice: number;
  ratings?: number;
  rating?: number;
  purchased: number;
  demoUrl: string;
  benefits?: ICourseBenefit[];
  prerequisites?: ICoursePrerequisite[];
  reviews?: ICourseReview[];
  courseData?: ICourseContent[];
}

export interface IUserCourse {
  _id?: string;
  courseId?: string;
}

export interface IRootUser {
  _id: string;
  name: string;
  role?: string;
  courses?: IUserCourse[];
}

interface RootState {
  auth: {
    user: IRootUser | null;
  };
}

type Props = {
  data: ICourseDetailsData;
  clientSecret: string;
  stripePromise: Promise<Stripe | null> | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setRoute: Dispatch<SetStateAction<string>>;
  createPaymentIntentFn: (price: number) => Promise<void> | void;
};

const CourseDetails: FC<Props> = ({
  data,
  stripePromise,
  clientSecret,
  setRoute,
  setOpen: OpenAuthModel,
  createPaymentIntentFn,
}) => {
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const isStripeReady = !!stripePromise;
  const {
    data: userData,
    isLoading: isLoadingUser,
    isFetching: isFetchingUser,
    refetch,
  } = useLoadUserQuery(undefined, { skip: !!reduxUser });
  const [open, setOpen] = useState(false);

  const user = reduxUser || userData?.user;
  const isLoggedIn = !!user && typeof user === "object" && !!user._id;

  // Extract ratings handling both backend singular `rating` and plural `ratings`
  const courseRating = data?.ratings ?? data?.rating ?? 0;

  // Safe Percentage calculation
  const discountPercentage =
    data?.estimatedPrice && data?.estimatedPrice > 0
      ? ((data.estimatedPrice - data.price) / data.estimatedPrice) * 100
      : 0;

  const discountPercentagePrice = Math.max(0, discountPercentage).toFixed(0);

  // Checking purchase status
  const isPurchased =
    isLoggedIn &&
    user.courses?.find((item: IUserCourse) => {
      const courseId = item?.courseId ?? item?._id ?? item;
      return courseId?.toString?.() === data?._id?.toString?.();
    });

  const handleOrder = async () => {
    if (!user && (isLoadingUser || isFetchingUser)) {
      const res = await refetch();
      const refreshedUser = res?.data?.user;
      if (refreshedUser) {
        await createPaymentIntentFn(data.price);
        setOpen(true);
        return;
      }
    }

    if (!isLoggedIn) {
      setRoute("Login");
      OpenAuthModel(true);
      return;
    }

    await createPaymentIntentFn(data.price);
    setOpen(true);
  };

  return (
    <>
      <div className="w-[90%] 800px:w-[90%] m-auto py-5">
        <div className="w-full flex flex-col-reverse 800px:flex-row">
          {/* LEFT SIDE */}
          <div className="w-full 800px:w-[65%] 800px:pr-5">
            <h1 className="text-[25px] font-Poppins font-semibold text-black dark:text-white">
              {data.name}
            </h1>
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center">
                <Ratings rating={courseRating} />
                <h5 className="text-black dark:text-white">
                  {data.reviews?.length || 0} Reviews
                </h5>
              </div>
              <h5 className="text-black dark:text-white">
                {data.purchased || 0} Students
              </h5>
            </div>
            <br />

            {/* Benefits */}
            <h1 className="text-[25px] font-Poppins font-semibold text-black dark:text-white">
              What you will learn from this course?
            </h1>
            <div>
              {data.benefits?.map((item: ICourseBenefit, index: number) => (
                <div
                  className="w-full flex 800px:items-center py-2"
                  key={index}
                >
                  <div className="w-3.75 mr-1">
                    <IoCheckmarkDoneOutline
                      size={20}
                      className="text-black dark:text-white"
                    />
                  </div>
                  <p className="pl-2 text-black dark:text-white">
                    {item.title}
                  </p>
                </div>
              ))}
              <br />
              <br />
            </div>
            <br />
            <br />

            {/* Prerequisites */}
            <h1 className="text-[25px] font-Poppins font-semibold text-black dark:text-white">
              What are the prerequisites for starting this course?
            </h1>
            {data.prerequisites?.map(
              (item: ICoursePrerequisite, index: number) => (
                <div
                  className="w-full flex 800px:items-center py-2"
                  key={index}
                >
                  <div className="w-3.75 mr-1">
                    <IoCheckmarkDoneOutline
                      size={20}
                      className="text-black dark:text-white"
                    />
                  </div>
                  <p className="pl-2 text-black dark:text-white">
                    {item.title}
                  </p>
                </div>
              ),
            )}
            <br />
            <br />

            <div>
              <h1 className="text-[25px] font-Poppins font-semibold text-black dark:text-white">
                Course Overview
              </h1>
              <CourseContentList data={data?.courseData || []} isDemo={true} />
            </div>
            <br />
            <br />

            {/* Course Description */}
            <div className="w-full">
              <h1 className="text-[25px] font-Poppins font-semibold text-black dark:text-white">
                Course Details
              </h1>
              <p className="text-[18px] mt-5 whitespace-pre-line w-full overflow-hidden text-black dark:text-white">
                {data.description}
              </p>
            </div>
            <br />
            <br />

            {/* REVIEWS */}
            <div className="w-full">
              <div className="800px:flex items-center">
                <Ratings rating={courseRating} />
                <div className="mb-2 800px:mb-[unset]" />
                <h5 className="text-[25px] font-Poppins text-black dark:text-white">
                  {Number.isInteger(courseRating)
                    ? courseRating.toFixed(1)
                    : courseRating.toFixed(2)}{" "}
                  Course Rating • {data?.reviews?.length || 0} Reviews
                </h5>
              </div>
              <br />
              {data?.reviews &&
                [...data.reviews]
                  .reverse()
                  .map((item: ICourseReview, index: number) => (
                    <div className="w-full pb-4" key={index}>
                      <div className="flex">
                        <div className="w-12.5 h-12.5">
                          <Image
                            src={
                              item.user?.avatar
                                ? item.user.avatar.url
                                : "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png"
                            }
                            width={50}
                            height={50}
                            alt=""
                            className="w-12.5 h-12.5 rounded-full object-cover"
                          />
                        </div>
                        <div className="hidden 800px:block pl-2">
                          <div className="flex items-center">
                            <h5 className="text-[18px] pr-2 text-black dark:text-white">
                              {item.user?.name || "Anonymous User"}
                            </h5>
                            <Ratings rating={item.rating} />
                          </div>
                          <p className="text-black dark:text-white">
                            {item.comment}
                          </p>
                          <small className="text-[#000000d1] dark:text-[#ffffff83]">
                            {formatTimeAgo(item.createdAt)} •
                          </small>
                        </div>
                      </div>

                      {item.commentReplies?.map(
                        (i: ICourseReviewReply, replyIndex: number) => (
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
                        ),
                      )}
                    </div>
                  ))}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-full 800px:w-[35%] relative">
            <div className="sticky top-25 left-0 z-50 w-full">
              <CoursePlayer
                videoUrl={data.demoUrl}
                title={data.title || data.name || ""}
              />
              <div className="flex items-center">
                <h1 className="pt-5 text-[25px] text-black dark:text-white">
                  {data.price === 0 ? "Free" : data.price + "$"}
                </h1>

                <h5 className="pl-3 text-[20px] mt-2 line-through opacity-80 text-black dark:text-white">
                  {data.estimatedPrice}$
                </h5>
                <h4 className="pl-5 pt-4 text-[22px] text-black dark:text-white">
                  {discountPercentagePrice}% Off
                </h4>
              </div>

              <div className="flex items-center">
                {isPurchased ? (
                  <Link
                    className={`${styles.button} w-45! my-3 font-Poppins cursor-pointer bg-[crimson]!`}
                    href={`/course-access/${data._id}`}
                  >
                    Enter to Course
                  </Link>
                ) : isStripeReady ? (
                  <div
                    className={`${styles.button} w-45! my-3 font-Poppins cursor-pointer bg-[crimson]!`}
                    onClick={handleOrder}
                  >
                    Buy Now {data.price}$
                  </div>
                ) : (
                  <></>
                )}
              </div>

              <p className="pb-1 text-black dark:text-white">
                • Source code included
              </p>
              <p className="pb-1 text-black dark:text-white">
                • Full lifetime access
              </p>
              <p className="pb-1 text-black dark:text-white">
                • Certificate of completion
              </p>
              <p className="pb-3 800px:pb-1 text-black dark:text-white">
                • Premium Support
              </p>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="w-full h-screen bg-[#00000036] fixed top-0 left-0 z-50 flex items-center justify-center">
          <div className="w-125 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow p-3">
            <div className="w-full flex justify-end">
              <IoCloseOutline
                size={40}
                className="text-black cursor-pointer"
                onClick={() => setOpen(false)}
              />
            </div>
            <div className="w-full">
              {stripePromise && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckOutForm
                    setOpen={setOpen}
                    refetch={refetch}
                    data={data}
                    user={user}
                  />
                </Elements>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseDetails;
