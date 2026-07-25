import {
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { FC, FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import socketIO, { Socket } from "socket.io-client";
import { userLogin } from "../../../redux/features/auth/authSlice";
import { useCreateOrderMutation } from "../../../redux/features/orders/orderApi";
import { styles } from "../../styles/styles";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { ICourseDetailsData, IRootUser, IUserCourse } from "../Courses/CourseDetails";

const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "";

export interface RootState {
  auth: {
    token: string | null;
    user: IRootUser | null;
  };
}

type Props = {
  setOpen: (open: boolean) => void;
  data: ICourseDetailsData;
  user: IRootUser | null;
  refetch: () => void;
};

const CheckOutForm: FC<Props> = ({ data, user, refetch, setOpen }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const socketRef = useRef<Socket | null>(null);
  const [message, setMessage] = useState<string>("");
  const [createOrder, { error, data: orderData }] = useCreateOrderMutation({});
  const [isLoading, setIsLoading] = useState(false);

  const courseId = data?._id;
  const courseName = data?.name;
  const userId = user?._id;

  useEffect(() => {
    // Avoid crashing the whole page if socket env isn't configured (common in prod previews).
    if (!ENDPOINT) return;
    const s = socketIO(ENDPOINT, { transports: ["websocket"] });
    socketRef.current = s;
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setIsLoading(false);
      createOrder({ courseId, payment_info: paymentIntent, userId });
    }
  };

  useEffect(() => {
    if (orderData) {
      // Frontend-only auth: do NOT refetch /me here (it can overwrite state).
      // Instead, update Redux user locally to reflect the newly purchased course.
      if (user && courseId) {
        const existingCourses = Array.isArray(user.courses) ? user.courses : [];
        const alreadyHas = existingCourses.some((item: IUserCourse) => {
          const id = item?.courseId ?? item?._id ?? item;
          return id?.toString?.() === courseId?.toString?.();
        });
        if (!alreadyHas) {
          dispatch(
            userLogin({
              // Convert null to undefined to match authSlice expectation
              accessToken: token ?? undefined,
              user: {
                ...user,
                courses: [...existingCourses, { courseId }],
              },
            })
          );
        }
      }
      socketRef.current?.emit?.("notification", {
        title: "New Order",
        message: `You Have A New Order From ${courseName ?? "a course"}`,
        userId,
      });
      toast.success("Payment successful! You now have access to this course.");
      // Close modal after success
      setOpen(false);
      if (courseId) {
        router.push(`/course-access/${courseId}`);
      } else {
        router.push("/");
      }
    }
    if (error) {
      toast.error(
        getErrorMessage(error, "We couldn't complete your order. Please try again.")
      );
    }
  }, [
    orderData,
    error,
    courseId,
    courseName,
    userId,
    refetch,
    router,
    dispatch,
    setOpen,
    token,
    user,
  ]);

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <LinkAuthenticationElement id="link-authentication-element" />
      <PaymentElement id="payment-element" />
      <button disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text" className={`${styles.button} mt-2 h-8.75!`}>
          {isLoading ? "Paying..." : "Pay Now"}
        </span>
      </button>

      {message && (
        <div id="payment-message" className="text-[red] font-Poppins pt-2">
          {message}
        </div>
      )}
    </form>
  );
};

export default CheckOutForm;