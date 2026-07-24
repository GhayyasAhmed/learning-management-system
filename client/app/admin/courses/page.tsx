"use client";
import DashboardHero from "../../components/Admin/DashboardHero";
import AdminProtected from "../../hooks/adminProtected";
import Heading from "../../utils/Heading";
import AdminSideBar from "../../components/Admin/sidebar/AdminSideBar";
import AllCourses from "../../components/Admin/Course/AllCourses";


const Page = () => {
  return (
    <div>
      <AdminProtected>
        <Heading
          title="Admin - ELearning"
          description="ELearning is a platform for online learning and education."
          keywords="ELearning, online learning, education, courses, tutorials, training"
        />
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="1500px:w-[16%] w-1/5">
            <AdminSideBar />
          </div>
          {/* Dashboard Hero */}
          <div className="w-4/5 p-4">
            <DashboardHero />
            <AllCourses />
          </div>
        </div>
      </AdminProtected>
    </div>
  );
};

export default Page;