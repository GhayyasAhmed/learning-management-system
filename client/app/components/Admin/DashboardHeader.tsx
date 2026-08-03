"use client";

import formatTimeAgo from "@/app/utils/formatTimeAgo";
import { getNotificationLink } from "@/app/utils/notificationLink";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import socketIO, { Socket } from "socket.io-client";
import {
  useGetAllNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useUpdateNotificationStatusMutation,
} from "../../../redux/features/notifications/notificationsApi";
import ThemeSwitcher from "../../utils/ThemeSwitcher";

const ENDPOINT =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URI ||
  process.env.NEXT_PUBLIC_SOCKET_URI ||
  "/";

// const socketId = socketIO(ENDPOINT, { transports: ["websocket"] });

export interface INotification {
  _id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  type?: string;
  courseId?: string;
  contentId?: string;
  questionId?: string;
  reviewId?: string;
}

interface DashboardHeaderProps {
  open?: boolean;
  setOpen: (open: boolean) => void;
  notifications: INotification[];
  unreadCount: number;
  markAllLoading: boolean;
  onNotificationStatusChange: (id: string) => Promise<void>;
  onNotificationClick: (item: INotification) => void;
  onMarkAllRead: () => void;
  onViewAll: () => void;
}

export const DashboardHeaderPresenter = ({
  open,
  setOpen,
  notifications,
  unreadCount,
  markAllLoading,
  onNotificationStatusChange,
  onNotificationClick,
  onMarkAllRead,
  onViewAll,
}: DashboardHeaderProps) => {
  const notifButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        notifButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  return (
    <div className="w-full flex items-center justify-end p-6 fixed top-5 right-0 z-9999">
      <ThemeSwitcher />
      <button
        type="button"
        ref={notifButtonRef}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="relative cursor-pointer m-2 bg-transparent border-0 p-0"
        onClick={() => setOpen(!open)}
      >
        <IoMdNotificationsOutline className="text-2xl cursor-pointer text-black dark:text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#3ccba0] rounded-full w-5 h-5 text-[12px] flex items-center justify-center text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="w-87.5 max-h-[60vh] dark:bg-[#111C43] bg-white shadow-2xl absolute top-16 right-2 z-10000 rounded overflow-hidden border border-[#00000014] dark:border-[#ffffff1a] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <div className="sticky top-0 z-10 dark:bg-[#111C43] bg-white border-b border-[#00000014] dark:border-[#ffffff1a]">
            <div className="flex items-center justify-between p-3">
              <h5 className="text-[18px] font-Poppins text-black dark:text-white">
                Notifications
              </h5>
              <button
                type="button"
                disabled={markAllLoading || unreadCount === 0}
                className={`text-[12px] font-Poppins underline underline-offset-2 text-black dark:text-white ${
                  markAllLoading || unreadCount === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                onClick={onMarkAllRead}
              >
                {markAllLoading ? "Marking..." : "Mark all as read"}
              </button>
            </div>
          </div>

          <div className="max-h-[calc(60vh-100px)] overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <p className="p-4 font-Poppins text-black dark:text-white opacity-80 text-center">
                No new notifications
              </p>
            ) : (
              notifications.map((item: INotification, index: number) => (
                <div
                  key={item?._id || index}
                  className="dark:bg-[#2d3a4ea1] bg-[#00000013] font-Poppins border-b dark:border-b-[#ffffff47] border-b-[#0000000f] cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => onNotificationClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onNotificationClick(item);
                    }
                  }}
                >
                  <div className="w-full flex items-center justify-between gap-3 p-2">
                    <p className="text-black dark:text-white font-semibold truncate">
                      {item.title}
                    </p>
                    <button
                      type="button"
                      className="text-black dark:text-white cursor-pointer whitespace-nowrap text-[14px] underline underline-offset-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNotificationStatusChange(item._id);
                      }}
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

          <div className="sticky bottom-0 dark:bg-[#111C43] bg-white border-t border-[#00000014] dark:border-[#ffffff1a]">
            <button
              type="button"
              className="w-full p-3 text-[14px] font-Poppins text-center text-black dark:text-white cursor-pointer"
              onClick={onViewAll}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

type ContainerProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

const DashboardHeader = ({
  open = false,
  setOpen = () => {},
}: ContainerProps) => {
  const router = useRouter();
  const { data, refetch } = useGetAllNotificationsQuery(
    { status: "unread", limit: 10 },
    { refetchOnMountOrArgChange: true },
  );

  const [updateNotificationStatus, { isSuccess }] =
    useUpdateNotificationStatusMutation();

  const [
    markAllNotificationsRead,
    { isLoading: markAllLoading, isSuccess: markAllSuccess },
  ] = useMarkAllNotificationsReadMutation();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "https://res.cloudinary.com/dasdrngo1/video/upload/v1715355770/notifications/mixkit-bubble-pop-up-alert-notification-2357_wbwviv.wav",
      );
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const notifications: INotification[] = useMemo(
    () => data?.notifications ?? [],
    [data],
  );
  const unreadCount: number = data?.unreadCount ?? 0;

  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  useEffect(() => {
    if (markAllSuccess) refetch();
  }, [markAllSuccess, refetch]);

  useEffect(() => {
    const socket = socketIO(ENDPOINT, { transports: ["websocket"] });
    socketRef.current = socket;
    const onNewNotification = (payload: unknown) => {
      if (payload) refetch();
      playNotificationSound();
    };

    socket.on("newNotification", onNewNotification);
    return () => {
      socket.off("newNotification", onNewNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refetch, playNotificationSound]);

  const handleNotificationStatusChange = async (id: string) => {
    if (!id) return;
    await updateNotificationStatus({ id, status: "read" });
  };

  const handleNotificationClick = (item: INotification) => {
    if (item.status === "unread") {
      handleNotificationStatusChange(item._id);
    }
    setOpen(false);
    const link = getNotificationLink(item);
    if (link) router.push(link);
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllLoading) return;
    markAllNotificationsRead(undefined);
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push("/admin/notifications");
  };

  return (
    <DashboardHeaderPresenter
      open={open}
      setOpen={setOpen}
      notifications={notifications}
      unreadCount={unreadCount}
      markAllLoading={markAllLoading}
      onNotificationStatusChange={handleNotificationStatusChange}
      onNotificationClick={handleNotificationClick}
      onMarkAllRead={handleMarkAllRead}
      onViewAll={handleViewAll}
    />
  );
};

export default DashboardHeader;
