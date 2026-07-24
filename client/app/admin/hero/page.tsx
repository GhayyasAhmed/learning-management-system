"use client";
import EditHero from "../../components/Admin/Customization/EditHero";
import DashBoardHero from "../../components/Admin/DashboardHero";
import AdminSidebar from "../../components/Admin/sidebar/AdminSideBar";
import AdminProtected from "../../hooks/adminProtected";
import Heading from "../../utils/Heading";

const Page = () => {
  return (
    <div>
      <AdminProtected>
        <Heading
          title="Elearning - Admin"
          description="ELearning is a platform for students to learn and get help from teachers"
          keywords="Programming,MERN,Redux,Machine Learning"
        />
        <div className="flex h-screen">
          <div className="1500px:w-[15%] w-1/5">
            <AdminSidebar />
          </div>
          <div className="w-[85%]">
            <DashBoardHero />
            <EditHero />
          </div>
        </div>
      </AdminProtected>
    </div>
  );
};

export default Page;