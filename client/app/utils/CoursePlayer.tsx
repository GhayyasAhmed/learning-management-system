"use client";
import axios from "axios";
import { useEffect, useState } from "react";
type Props = {
  videoUrl: string;
  title: string;
};

const CoursePlayer = ({ videoUrl }: Props) => {
  const [videoData, setVideoData] = useState({
    otp: "",
    playbackInfo: "",
  });

  console.log("videoUrl", videoUrl);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!baseUrl) {
      console.error(
        "NEXT_PUBLIC_SERVER_URL is not set. Cannot request VdoCipher OTP."
      );
      return;
    }

    const url = baseUrl.endsWith("/")
      ? `${baseUrl}getVdoCipherOTP`
      : `${baseUrl}/getVdoCipherOTP`;

    axios
      .post(url, {
        videoId: videoUrl,
      })
      .then((res) => {
        setVideoData(res.data);
      })
      .catch((err) => {
        console.error("VdoCipher OTP API Error:", err?.response?.data || err);
      });
  }, [videoUrl]);

  return (
    <div
      style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden" }}
    >
      {videoData.otp && videoData.playbackInfo !== "" && (
        <iframe
          src={`https://player.vdocipher.com/v2/?otp=${videoData.otp}&playbackInfo=${videoData.playbackInfo}&player=cDzWaw5pK6ptF60G`}
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