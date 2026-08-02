"use client";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    AiFillGithub,
    AiOutlineEye,
    AiOutlineEyeInvisible,
} from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import * as Yup from "yup";
import { styles } from "../../../app/styles/styles";
import { useRegisterMutation } from "../../../redux/features/auth/authApi";
import { getErrorMessage } from "../../utils/getErrorMessage";

type Props = {
  setRoute: (route: string) => void;
  setOpen: (route: boolean) => void;
};

const schema = Yup.object().shape({
  name: Yup.string().required("Please Enter Your Name"),
  email: Yup.string()
    .email("Invalid Email!")
    .required("Please Enter Your Email"),
  password: Yup.string().required("Please Enter Your Password").min(6),
});



// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SignUp = ({ setRoute, setOpen }: Props) => {
  const [show, setShow] = useState(false);
  const [register, {isSuccess, data, error, isLoading}] = useRegisterMutation();

  useEffect(() => {
    if (isSuccess) {
      const message = data?.message || "Registration successful! Please verify your account.";
      toast.success(message);
      setRoute("Verification");
    }
    if (error) {
      toast.error(getErrorMessage(error, "Registration failed. Please try again."));

    }
  }, [isSuccess, error, data?.message, setRoute]);


  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    validationSchema: schema,
    onSubmit: async ({ name, email, password }) => {
      if (isLoading) return;
      const data = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };
      await register(data);
    },
  });
  const { errors, handleChange, touched, values, handleSubmit } = formik;

  return (
    <div className="w-full">
      <h1 id="modal-modal-title" className={`${styles.title}`}>Join to ELearning</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className={`${styles.label}`} htmlFor="name">e
            Enter Your Name
          </label>
          <input
            type="text"
            name=""
            value={values.name}
            onChange={handleChange}
            id="name"
            aria-invalid={!!(errors.name && touched.name)}
            aria-describedby={errors.name && touched.name ? "name-error" : undefined}
            placeholder="User Name"
            className={`${errors.name && touched.name && "border-red-500"} ${
              styles.input
            }`}
          />
          {errors.name && touched.name && (
            <span id="name-error" role="alert" className="text-red-500 pt-2 block">{errors.name}</span>
          )}
        </div>
        <label className={`${styles.label}`} htmlFor="email">
          Enter Your Email
        </label>
        <input
          type="email"
          name=""
          value={values.email}
          onChange={handleChange}
          id="email"
          aria-invalid={!!(errors.email && touched.email)}
          aria-describedby={errors.email && touched.email ? "email-error" : undefined}
          placeholder="loginemail@gmail.com"
          className={`${errors.email && touched.email && "border-red-500"} ${
            styles.input
          }`}
        />
        {errors.email && touched.email && (
          <span id="email-error" role="alert" className="text-red-500 pt-2 block">{errors.email}</span>
        )}
        <div className="w-full mt-5 relative mb-1">
          <label className={`${styles.label}`} htmlFor="password">
            Enter Your Password
          </label>
          <input
            type={!show ? "password" : "text"}
            name="password"
            value={values.password}
            onChange={handleChange}
            id="password"
            aria-invalid={!!(errors.password && touched.password)}
            aria-describedby={errors.password && touched.password ? "password-error" : undefined}
            placeholder="passwords!@#%"
            className={`${
              errors.password && touched.password && "border-red-500"
            } ${styles.input}`}
          />
          {!show ? (
            <button
              type="button"
              aria-label="Show password"
              className="absolute bottom-3 right-2 z-1 bg-transparent border-0"
              onClick={() => setShow(true)}
            >
              <AiOutlineEyeInvisible size={20} />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Hide password"
              className="absolute bottom-3 right-2 z-1 bg-transparent border-0"
              onClick={() => setShow(false)}
            >
              <AiOutlineEye size={20} />
            </button>
          )}
          {errors.password && touched.password && (
            <span id="password-error" role="alert" className="text-red-500 pt-2 block">{errors.password}</span>
          )}
        </div>
        <div className="w-full mt-5">
          <input
            type="submit"
            value={isLoading ? "Creating account..." : "Sign Up"}
            // value={"Sign Up"}
            disabled={isLoading}
            className={`${styles.button} ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            // className={`${styles.button}`}
          />
        </div>
        <br />
        <br />
        <h5 className="text-center pt-4 font-Poppins text-[14px] text-black dark:text-white">
          Or Join With
        </h5>
        <div className="flex items-center justify-center my-3 ">
          <FcGoogle
            className="cursor-pointer mr-2"
            size={30}
          />
          <AiFillGithub
            className="cursor-pointer mr-2"
            size={30}
          />
        </div>
        <h5 className="text-center pt-4 font-Poppins text-[14px]">
          Already have an account?{" "}
          <span
            className="text-[#2190ff] pl-1 cursor-pointer"
            onClick={() => setRoute("Login")}
          >
            Sign In
          </span>
        </h5>
      </form>
      <br />
    </div>
  );
};

export default SignUp;