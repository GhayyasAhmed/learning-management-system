"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { VscWorkspaceTrusted } from "react-icons/vsc";
// import { useSelector } from "react-redux";
import { styles } from "../../../app/styles/styles";
// import { useActivationMutation } from "../../../redux/features/auth/authApi";
// import { getErrorMessage } from "../../utils/getErrorMessage";


type Props = {
  setRoute: (route: string) => void;
};

type verifyNumberType = {
  "0": string;
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
};

const Verification = ({ setRoute }: Props) => {
  const [invalidError, setInvalidError] = useState(false);
//   const {token}= useSelector((state:any) => state.auth);
//   const [activation, {isSuccess,error, isLoading}]= useActivationMutation();

  //Handling the API response
//   useEffect(() => {
//     if (isSuccess) {
//       toast.success("Account activated successfully! You can now log in.");
//       setRoute("Login");
//     }
//     if (error) {
//       toast.error(getErrorMessage(error, "Verification failed. Please check the code and try again."));
//       setInvalidError(true);
//     }
//   }, [isSuccess, error, setRoute]);
 

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [verifyNumber, setVerifyNumber] = useState<verifyNumberType>({
    0: "",
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
  });

  // Handle OTP verification
  const verificationHandler = async () => {
    const verificationNumber = Object.values(verifyNumber).join("");
    if (verificationNumber.length !== 6) {
      setInvalidError(true);
      toast.error("Please enter all 6 digits of the code.");
      return;
    }
    // await activation({ activation_token: token, activation_code: verificationNumber });
  };

  // Handle input change Focus Next box
  const handleInputChange = (index: number, value: string) => {
    setInvalidError(false);
    const newVerifyNumber = { ...verifyNumber, [index]: value };
    setVerifyNumber(newVerifyNumber);
    if (value === "" && index > 0) { 
      inputRefs[index - 1].current?.focus();
    } else if (value.length === 1 && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  return (
    <div>
      <h1 className={`${styles.title}`}>Verify Your Account</h1>
      <br />
      {/* Blue circular icon */}
      <div className="w-full flex items-center justify-center mt-2">
        <div className="w-20 h-20 rounded-full bg-[#497DF2] flex items-center justify-center">
          <VscWorkspaceTrusted size={30} />
        </div>
      </div>
      <br />
      <br />

      {/* Six OTP inputs */}
      <div className="m-auto flex items-center justify-around">
        {Object.keys(verifyNumber).map((key, index) => (
          <input
            type="number"
            key={key}
            ref={inputRefs[index]}
            className={`w-16.25 h-16.25 bg-transparent border-[3px] rounded-[10px] flex items-center text-black dark:text-white justify-center text-[18px] font-Poppins outline-none text-center ${
              invalidError
                ? "shake border-red-500"
                : "dark:border-white border-[#0000004a]"
            }`}
            placeholder=""
            maxLength={1}
            value={verifyNumber[key as keyof verifyNumberType]}
            onChange={(e) => handleInputChange(index, e.target.value)}
          />
        ))}
      </div>
      <br />
      <br />
      {/* Verify button */}
      <div className="w-full flex justify-center">
        <button
        //   className={`${styles.button} ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          className={`${styles.button}`}
          onClick={verificationHandler}
        //   disabled={isLoading}
        >
            Verify OTP
          {/* {isLoading ? "Verifying..." : "Verify OTP"} */}
        </button>
      </div>
      <br />
      {/* Go back footer link */}
      <h5 className="text-center pt-4 font-Poppins text-[14px] text-black dark:text-white">
        Go Back to sign in?
        <span
          className="text-[#2190ff] pl-1 cursor-pointer"
          onClick={() => setRoute("Login")}
        >
          SignIn
        </span>
      </h5>
    </div>
  );
};

export default Verification;