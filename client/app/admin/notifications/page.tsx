"use client";
import AllNotifications from "../../components/Admin/Notification/AllNotifications";
import AdminSideBar from "../../components/Admin/sidebar/AdminSideBar";
import AdminProtected from "../../hooks/adminProtected";
import Heading from "../../utils/Heading";

const Page = () => {
  return (
    <div>
      <AdminProtected>
        <Heading
          title="Notifications - Admin"
          description="ELearning is a platform for online learning and education."
          keywords="ELearning, notifications, admin"
        />
        <div className="flex min-h-screen">
          <div className="1500px:w-[16%] w-1/5">
            <AdminSideBar />
          </div>
          <div className="w-[85%]">
            <AllNotifications />
          </div>
        </div>
      </AdminProtected>
    </div>
  );
};

export default Page;