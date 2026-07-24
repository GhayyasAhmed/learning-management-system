"use client";
import AdminProtected from "../hooks/adminProtected";
import Heading from "../utils/Heading";
import AdminSideBar from "../components/Admin/sidebar/AdminSideBar";
import DashboardHero from "../components/Admin/DashboardHero";


type AdminPageProps = object

const Page = ({ }: AdminPageProps) => {
    return (
        <AdminProtected>
        <Heading
          title="Admin - ELearning"
          description="ELearning is a platform for online learning and education."
          keywords="ELearning, online learning, education, courses, tutorials, training"
        />
        <div className="flex h-[200vh]">
          {/* Sidebar */}
          <div className="1500px:w-[16%] w-1/5">
            <AdminSideBar />
          </div>
          {/* Dashboard Hero */}
          <div className="w-4/5 p-4">
            <DashboardHero isDashboard={true} /> 
          </div>
        </div>
      </AdminProtected>
    )
}

export default Page;