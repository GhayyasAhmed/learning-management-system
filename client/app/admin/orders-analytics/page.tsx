"use client";
import Heading from "../../utils/Heading";
import OrderAnalytics from "../../components/Admin/Analytics/OrdersAnalytics";
import AdminProtected from "../../hooks/adminProtected";
import AdminSidebar from "../../components/Admin/sidebar/AdminSideBar";
import DashboardHero from "../../components/Admin/DashboardHero";


const Page = () => {
  return (
    <div>
      <AdminProtected>
        <Heading
          title="ELearning Admin"
          description="ELearning is a platform for students to learn and get help from teachers"
          keywords="Programming, MERN, Redux,AI/ML"
        />
        <div className="flex min-h-screen">
          <div className="1500px:w-1/6 w-1/5">
            <AdminSidebar />
          </div>
          <div className="w-[85%]">
            <DashboardHero isDashboard={false} />
            <OrderAnalytics />
          </div>
        </div>
      </AdminProtected>
    </div>
  );
};

export default Page;