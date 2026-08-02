"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
type Props = {
  videoUrl: string;
  title: string;
};

const CoursePlayer = ({ videoUrl, title }: Props) => {
  const [videoData, setVideoData] = useState({
    otp: "",
    playbackInfo: "",
  });

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!baseUrl) {
      toast.error("Failed to upload video. Try again");
      return;
    }

    // const url = baseUrl.endsWith("/")
    //   ? `${baseUrl}getVdoCipherOTP`
    //   : `${baseUrl}/getVdoCipherOTP`;

    axios
      .post(`${baseUrl}/course/getVdoCipherOTP`, {
        videoId: videoUrl,
      })
      .then((res) => {
        setVideoData(res.data);
      })
      .catch(() => {
        toast.error("Failed to upload video. Try again");
        // console.error("VdoCipher OTP API Error:", err?.response?.data || err);
      });
  }, [videoUrl]);

  return (
    <div
      style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden" }}
    >
      {videoData.otp && videoData.playbackInfo !== "" && (
        <iframe
          src={`https://player.vdocipher.com/v2/?otp=${videoData.otp}&playbackInfo=${videoData.playbackInfo}&player=GzBf2RAWMqlXmTij`}
          title={title || "Course video player"}
          style={{
            border: 0,
            maxWidth: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "100%",
          }}
          allowFullScreen={true}
          allow="encrypted-media"
        />
      )}
    </div>
  );
};

export default CoursePlayer;
