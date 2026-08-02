"use client";

import formatTimeAgo from "@/app/utils/formatTimeAgo";
import { getNotificationLink } from "@/app/utils/notificationLink";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  useGetAllNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useUpdateNotificationStatusMutation,
} from "../../../../redux/features/notifications/notificationsApi";
import { styles } from "../../../styles/styles";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import Loader from "../../Loader/Loader";
import { INotification } from "../DashboardHeader";

type TabType = "all" | "unread" | "read";

const TABS: { label: string; value: TabType }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
];

const PAGE_SIZE = 20;

const AllNotifications = () => {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, error, refetch } =
    useGetAllNotificationsQuery(
      { page, limit: PAGE_SIZE, status: tab },
      { refetchOnMountOrArgChange: true },
    );

  const [updateNotificationStatus] = useUpdateNotificationStatusMutation();
  const [markAllNotificationsRead, { isLoading: markAllLoading }] =
    useMarkAllNotificationsReadMutation();

  const notifications: INotification[] = data?.notifications ?? [];
  const pagination = data?.pagination;
  const unreadCount: number = data?.unreadCount ?? 0;

  const handleTabChange = (value: TabType) => {
    setTab(value);
    setPage(1);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateNotificationStatus({ id, status: "read" }).unwrap();
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update notification."));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(undefined).unwrap();
      toast.success("All notifications marked as read");
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not mark all as read."));
    }
  };

  const handleClick = (item: INotification) => {
    if (item.status === "unread") {
      handleMarkAsRead(item._id);
    }
    const link = getNotificationLink(item);
    if (link) router.push(link);
  };

  return (
    <div className="w-full pt-25 px-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h1 className={`${styles.title} text-start!`}>Notifications</h1>
        <button
          type="button"
          disabled={markAllLoading || unreadCount === 0}
          className={`${styles.button} w-50! h-9! ${
            markAllLoading || unreadCount === 0
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
          onClick={handleMarkAllRead}
        >
          {markAllLoading ? "Marking..." : "Mark all as read"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5" role="tablist" aria-label="Notification filter">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`px-4 py-2 rounded-full font-Poppins cursor-pointer ${
              tab === t.value ? "bg-[crimson] text-white" : "bg-[#5050cb] text-white"
            }`}
            onClick={() => handleTabChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <p className="text-black dark:text-white opacity-80 font-Poppins">
          Failed to load notifications.
        </p>
      ) : notifications.length === 0 ? (
        <p className="text-black dark:text-white opacity-80 font-Poppins">
          No notifications found.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item._id}
                onClick={() => handleClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick(item);
                  }
                }}
                className={`w-full p-4 rounded border cursor-pointer font-Poppins dark:border-[#ffffff1a] border-[#00000014] ${
                  item.status === "unread"
                    ? "dark:bg-[#2d3a4ea1] bg-[#00000013]"
                    : "dark:bg-transparent bg-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-black dark:text-white font-semibold">
                    {item.title}
                  </p>
                  {item.status === "unread" && (
                    <button
                      type="button"
                      className="text-[14px] underline underline-offset-2 text-black dark:text-white cursor-pointer whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item._id);
                      }}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                <p className="text-black dark:text-white pt-1">{item.message}</p>
                <small className="text-black dark:text-white opacity-70">
                  {formatTimeAgo(item.createdAt)}
                </small>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="w-full flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                className={`px-4 py-2 rounded bg-[#37a39a] text-white ${
                  page <= 1 || isFetching ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="text-black dark:text-white font-Poppins" aria-live="polite">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages || isFetching}
                className={`px-4 py-2 rounded bg-[#37a39a] text-white ${
                  page >= pagination.totalPages || isFetching
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllNotifications;