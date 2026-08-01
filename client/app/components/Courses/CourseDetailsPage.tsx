"use client";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { FC, useEffect, useMemo, useState } from "react";
import { useGetCourseDetailsQuery } from "../../../redux/features/courses/courseApi";
import {
  useCreatePaymentIntentMutation,
  useGetStripePublishAbleKeyQuery,
} from "../../../redux/features/orders/orderApi";
import Heading from "../../utils/Heading";
import Footer from "../Footer";
import Header from "../Header";
import Loader from "../Loader/Loader";
import CourseDetails from "./CourseDetails";

type Props = {
  id: string;
};

const CourseDetailsPage: FC<Props> = ({ id }: Props) => {
  const [route, setRoute] = useState("Login");
  const [open, setOpen] = useState(false);
  const { isLoading, data } = useGetCourseDetailsQuery(id);

  // Get Stripe Publishable Key
  const { data: config } = useGetStripePublishAbleKeyQuery({});
  
  // 1. Extract the string primitive beforehand to satisfy the React Compiler
  const publishableKey = config?.publishableKey; //publishableKey

  // Receive client secret by passing amount/id
  const [
    createPaymentIntent,
    { data: paymentIntentdata, error: paymentIntentError },
  ] = useCreatePaymentIntentMutation({});

  // 2. Use the extracted flat variable in the dependency array
  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    if (publishableKey) {
      return loadStripe(publishableKey);
    }
    return null;
  }, [publishableKey]);
  
  // Derive clientSecret directly from query response
  const clientSecret = paymentIntentdata?.client_secret || "";
 
  useEffect(() => {
    if (paymentIntentError) {
      console.error("Error while creating payment intent:", paymentIntentError);
    }
  }, [paymentIntentError]);

  // Trigger payment intent creation when the user actually wants to buy.
  // We send the courseId (not a price); the server computes the amount securely.
  const handleCreatePaymentIntent = async (price: number) => {
    if (!price || price <= 0) {
      console.error("Invalid price passed to handleCreatePaymentIntent:", price);
      return;
    }

    try {
      await createPaymentIntent(id);
    } catch (error) {
      console.error("Failed to create payment intent:", error);
    }
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {/* Page description/canonical/OG are handled server-side by
              generateMetadata in app/course/[id]/page.tsx; only the
              live-updating title (and keywords) are set here to avoid a
              duplicate <meta name="description"> tag. */}
          <Heading
            title={`${data?.course?.name || "Course"}-ELearning`}
            keywords={data?.course?.tags}
          />
          <Header
            route={route}
            open={open}
            setRoute={setRoute}
            setOpen={setOpen}
            activeItem={1}
          />
          {/* {stripePromise && ( */}
            <CourseDetails
              setRoute={setRoute}
              setOpen={setOpen}
              data={data?.course}
              stripePromise={stripePromise}
              clientSecret={clientSecret}
              createPaymentIntentFn={handleCreatePaymentIntent}
            />
          {/* )} */}
          <Footer />
        </>
      )}
    </>
  );
};

export default CourseDetailsPage;