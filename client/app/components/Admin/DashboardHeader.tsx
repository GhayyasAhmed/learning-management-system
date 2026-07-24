"use client";

import formatTimeAgo from "@/app/utils/formatTimeAgo";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import socketIO from "socket.io-client";
import {
    useGetAllNotificationsQuery,
    useUpdateNotificationStatusMutation,
} from "../../../redux/features/notifications/notificationsApi";
import ThemeSwitcher from "../../utils/ThemeSwitcher";

const ENDPOINT =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URI ||
  process.env.NEXT_PUBLIC_SOCKET_URI ||
  "/";

const socketId = socketIO(ENDPOINT, { transports: ["websocket"] });

export interface INotification {
  _id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

interface DashboardHeaderProps {
  open?: boolean;
  setOpen: (open: boolean) => void;
  notifications: INotification[];
  onNotificationStatusChange: (id: string) => Promise<void>;
}

// ---------------------------------------------------------
// Presenter Component: Pure UI
// ---------------------------------------------------------
export const DashboardHeaderPresenter = ({
  open,
  setOpen,
  notifications,
  onNotificationStatusChange,
}: DashboardHeaderProps) => {
  return (
    <div className="w-full flex items-center justify-end p-6 fixed top-5 right-0 z-9999">
      <ThemeSwitcher />
      {/* Notification bell icon */}
      <div
        className="relative cursor-pointer m-2"
        onClick={() => setOpen(!open)}
      >
        <IoMdNotificationsOutline className="text-2xl cursor-pointer text-black dark:text-white" />
        <span className="absolute -top-2 -right-2 bg-[#3ccba0] rounded-full w-5 h-5 text-[12px] flex items-center justify-center text-white">
          {notifications ? notifications.length : 0}
        </span>
      </div>

      {/* Notification dropdown */}
      {open && (
        <div className="w-87.5 max-h-[60vh] dark:bg-[#111C43] bg-white shadow-2xl absolute top-16 right-2 z-10000 rounded overflow-hidden border border-[#00000014] dark:border-[#ffffff1a]">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 dark:bg-[#111C43] bg-white border-b border-[#00000014] dark:border-[#ffffff1a]">
            <h5 className="text-center text-[20px] font-Poppins text-black dark:text-white p-3">
              Notifications
            </h5>
          </div>

          {/* Scrollable list */}
          <div className="max-h-[calc(60vh-56px)] overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <p className="p-4 font-Poppins text-black dark:text-white opacity-80 text-center">
                No new notifications
              </p>
            ) : (
              notifications.map((item: INotification, index: number) => (
                <div
                  key={item?._id || index}
                  className="dark:bg-[#2d3a4ea1] bg-[#00000013] font-Poppins border-b dark:border-b-[#ffffff47] border-b-[#0000000f]"
                >
                  <div className="w-full flex items-center justify-between gap-3 p-2">
                    <p className="text-black dark:text-white font-semibold truncate">
                      {item.title}
                    </p>
                    <button
                      type="button"
                      className="text-black dark:text-white cursor-pointer whitespace-nowrap text-[14px] underline underline-offset-2"
                      onClick={() => onNotificationStatusChange(item._id)}
                    >
                      Mark as read
                    </button>
                  </div>
                  <p className="px-2 pb-1 text-black dark:text-white">
                    {item.message}
                  </p>
                  <p className="p-2 text-black dark:text-white text-[14px] opacity-80">
                    {formatTimeAgo(item.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// Container Component: Logic, Query & Socket Handlers
// ---------------------------------------------------------
type ContainerProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

const DashboardHeader = ({ open = false, setOpen = () => {} }: ContainerProps) => {
  const { data, refetch } = useGetAllNotificationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [updateNotificationStatus, { isSuccess }] =
    useUpdateNotificationStatusMutation();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "https://res.cloudinary.com/dasdrngo1/video/upload/v1715355770/notifications/mixkit-bubble-pop-up-alert-notification-2357_wbwviv.wav"
      );
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  // Compute unread notifications dynamically without triggering useEffect setState
  const notifications: INotification[] = useMemo(() => {
    if (!data?.notifications) return [];
    return data.notifications
      .filter((item: INotification) => item.status === "unread")
      .slice()
      .sort(
        (a: INotification, b: INotification) =>
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime()
      );
  }, [data]);

  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  useEffect(() => {
    const onNewNotification = (payload: unknown) => {
      if (payload) {
        refetch();
      }
      playNotificationSound();
    };

    socketId.on("newNotification", onNewNotification);
    return () => {
      socketId.off("newNotification", onNewNotification);
    };
  }, [refetch, playNotificationSound]);

  const handleNotificationStatusChange = async (id: string) => {
    await updateNotificationStatus(id);
  };

  return (
    <DashboardHeaderPresenter
      open={open}
      setOpen={setOpen}
      notifications={notifications}
      onNotificationStatusChange={handleNotificationStatusChange}
    />
  );
};

export default DashboardHeader;