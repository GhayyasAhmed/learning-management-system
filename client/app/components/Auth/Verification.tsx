"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { VscWorkspaceTrusted } from "react-icons/vsc";
import { useSelector } from "react-redux";
import { styles } from "../../../app/styles/styles";
import { useActivationMutation } from "../../../redux/features/auth/authApi";
import { getErrorMessage } from "../../utils/getErrorMessage";

type Props = {
  setRoute: (route: string) => void;
};

type verifyNumberType = {
  "0": string;
  "1": string;
  "2": string;
  "3": string;
};

const Verification = ({ setRoute }: Props) => {
  const [invalidError, setInvalidError] = useState(false);
  const { token } = useSelector((state: any) => state.auth);
  const [activation, { isSuccess, error, isLoading, isError }] =
    useActivationMutation();

  const [verifyNumber, setVerifyNumber] = useState<verifyNumberType>({
    0: "",
    1: "",
    2: "",
    3: "",
  });

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Handling API response
  useEffect(() => {
    if (isSuccess) {
      toast.success("Account activated successfully! You can now log in.");
      setRoute("Login");
    }
    if (error) {
      toast.error(
        getErrorMessage(
          error,
          "Verification failed. Please check the code and try again.",
        ),
      );
    }
  }, [isSuccess, error, setRoute]);

  // Core trigger to execute verification API call
  const triggerVerification = async (code: string) => {
    if (code.length !== 4) {
      setInvalidError(true);
      toast.error("Please enter all 4 digits of the code.");
      return;
    }
    setInvalidError(false);
    await activation({ activationToken: token, activationCode: code });
  };

  const verificationHandler = () => {
    const verificationNumber = Object.values(verifyNumber).join("");
    triggerVerification(verificationNumber);
  };

  // 1. Handle Copy-Pasting Code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");

    // Extract numbers only and keep up to 4 digits
    const digitsOnly = pastedData.replace(/\D/g, "").slice(0, 4);

    if (!digitsOnly) return;

    setInvalidError(false);

    // Build new state object from sliced numbers
    const updatedVerifyNumber: verifyNumberType = {
      0: "",
      1: "",
      2: "",
      3: "",
    };
    digitsOnly.split("").forEach((char, idx) => {
      if (idx < 4) {
        // updatedVerifyNumber[idx as keyof verifyNumberType] = char;
        updatedVerifyNumber[`${idx}` as keyof verifyNumberType] = char;
      }
    });

    setVerifyNumber(updatedVerifyNumber);

    // Focus the box corresponding to the last entered digit (or the last box if full)
    const focusIndex = Math.min(digitsOnly.length - 1, 3);
    inputRefs[focusIndex].current?.focus();

    // Auto-submit if all 4 digits were pasted
    if (digitsOnly.length === 4) {
      triggerVerification(digitsOnly);
    }
  };

  // 2. Handle Individual Input Changes & Auto-Focusing
  const handleInputChange = (index: number, value: string) => {
    setInvalidError(false);

    // Take only the last character typed if multiple get passed
    const lastChar = value.slice(-1);

    const updatedVerifyNumber = { ...verifyNumber, [index]: lastChar };
    setVerifyNumber(updatedVerifyNumber);

    // Auto focus next input
    if (lastChar !== "" && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit if all inputs are now filled
    // const fullCode = Object.values(updatedVerifyNumber).join("");
    // if (fullCode.length === 4) {
    //   triggerVerification(fullCode);
    // }
  };

  // 3. Handle Backspace Key Navigation
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      e.key === "Backspace" &&
      !verifyNumber[`${index}`as keyof verifyNumberType] &&
      index > 0
    ) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <div>
      <h1 className={`${styles.title}`}>Verify Your Account</h1>
      <br />

      {/* Icon */}
      <div className="w-full flex items-center justify-center mt-2">
        <div className="w-20 h-20 rounded-full bg-[#497DF2] flex items-center justify-center">
          <VscWorkspaceTrusted size={30} />
        </div>
      </div>
      <br />
      <br />

      {/* OTP Input Fields */}
      <div className="m-auto flex items-center justify-around">
        {Object.keys(verifyNumber).map((key, index) => (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            key={key}
            ref={inputRefs[index]}
            className={`w-16.25 h-16.25 bg-transparent border-[3px] rounded-[10px] flex items-center text-black dark:text-white justify-center text-[18px] font-Poppins outline-none text-center ${
              invalidError || isError
                ? "shake border-red-500"
                : "dark:border-white border-[#0000004a]"
            }`}
            maxLength={1}
            value={verifyNumber[key as keyof verifyNumberType]}
            onPaste={handlePaste}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
          />
        ))}
      </div>
      <br />
      <br />

      {/* Verify Button */}
      <div className="w-full flex justify-center">
        <button
          className={`${styles.button} ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          onClick={verificationHandler}
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
      <br />

      {/* Navigation link */}
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
