"use client";

import { Box, CircularProgress } from "@mui/material";
import { useMemo } from "react";
import { BiBorderLeft } from "react-icons/bi";
import { PiUsersFourLight } from "react-icons/pi";
import {
    useGetOrdersAnalyticsQuery,
    useGetUsersAnalyticsQuery,
} from "../../../../redux/features/analytics/analyticsApi";
import Loader from "../../Loader/Loader";
import OrdersAnalytics from "../Analytics/OrdersAnalytics";
import UserAnalytics from "../Analytics/UserAnalytics";
import AllInvoices from "../Order/AllInvoices";

export interface IMonthData {
  month: string;
  count: number;
}

export interface IComparePercentage {
  currentMonth: number;
  previousMonth: number;
  percentChange: number;
}

interface CircularProgressProps {
  open?: boolean;
  value?: number;
}

interface DashboardWidgetsPresenterProps {
  open?: boolean;
  isLoading: boolean;
  userComparePercentage: IComparePercentage;
  ordersComparePercentage: IComparePercentage;
}

// ---------------------------------------------------------
// Sub-Component: Progress Bar Indicator
// ---------------------------------------------------------
const CircularProgressWithLabel = ({
  open,
  value = 0,
}: CircularProgressProps) => {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        variant="determinate"
        value={value}
        size={45}
        color={value > 99 ? "info" : "error"}
        thickness={4}
        style={{ zIndex: open ? -1 : 1 }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </Box>
  );
};

// ---------------------------------------------------------
// Presenter Component: Pure Visual Rendering
// ---------------------------------------------------------
export const DashboardWidgetsPresenter = ({
  open,
  isLoading,
  userComparePercentage,
  ordersComparePercentage,
}: DashboardWidgetsPresenterProps) => {
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="mt-7.5 min-h-screen">
      <div className="grid 800px:grid-cols-[75%,25%]">
        <div className="pt-2.5 800px:p-7">
          <UserAnalytics isDashboard={true} />
        </div>

        <div className="pt-5 800px:pt-10 p-1.25 800px:block flex items-center justify-between">
          {/* Sales Card */}
          <div className="w-full dark:bg-[#111C43] rounded-sm shadow my-10 mr-2.5 800px:my-8">
            <div className="flex items-center p-5 justify-between">
              <div>
                <BiBorderLeft className="dark:text-[#45CBA0] text-black text-[30px]" />
                <h5 className="pt-2 font-Poppins dark:text-white text-black text-[20px]">
                  {ordersComparePercentage.currentMonth}
                </h5>
                <h5 className="py-2 font-Poppins dark:text-[#45CBA0] text-black text-[20px] font-normal">
                  Sales Obtained
                </h5>
              </div>
              <div>
                <CircularProgressWithLabel
                  value={ordersComparePercentage.percentChange > 0 ? 100 : 0}
                  open={open}
                />
                <h5 className="text-center pt-4">
                  {ordersComparePercentage.percentChange > 0
                    ? `+${ordersComparePercentage.percentChange.toFixed(2)}`
                    : `${ordersComparePercentage.percentChange.toFixed(2)}`}{" "}
                  %
                </h5>
              </div>
            </div>
          </div>

          {/* New Users Card */}
          <div className="w-full dark:bg-[#111C43] rounded-sm shadow 800px:my-8 my-10">
            <div className="flex items-center p-5 justify-between">
              <div>
                <PiUsersFourLight className="dark:text-[#45CBA0] text-black text-[30px]" />
                <h5 className="pt-2 font-Poppins dark:text-white text-black text-[20px]">
                  {userComparePercentage.currentMonth}
                </h5>
                <h5 className="py-2 font-Poppins dark:text-[#45CBA0] text-black text-[20px] font-normal">
                  New Users
                </h5>
              </div>
              <div>
                <CircularProgressWithLabel
                  value={userComparePercentage.percentChange > 0 ? 100 : 0}
                  open={open}
                />
                <h5 className="text-center pt-4">
                  {userComparePercentage.percentChange > 0
                    ? `+${userComparePercentage.percentChange.toFixed(2)}`
                    : `${userComparePercentage.percentChange.toFixed(2)}`}{" "}
                  %
                </h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Analytics Section */}
      <div className="grid 800px:grid-cols-[65%,35%] -mt-5">
        <div className="dark:bg-[#111c43] w-[95%] 800px:w-[94%] mt-0 h-[30vh] 800px:h-[40vh] shadow-sm m-auto">
          <OrdersAnalytics isDashboard={true} />
        </div>
        <div className="p-5">
          <h5 className="dark:text-white text-black text-[20px] font-normal font-Poppins pb-3">
            Recent Transactions
          </h5>
          <AllInvoices isDashboard={true} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// Container Component: Queries, Computations & Logic
// ---------------------------------------------------------
type DashboardWidgetsProps = {
  open?: boolean;
};

const DashboardWidgets = ({ open }: DashboardWidgetsProps) => {
  const { data: usersData, isLoading: usersLoading } =
    useGetUsersAnalyticsQuery({});
  const { data: ordersData, isLoading: ordersLoading } =
    useGetOrdersAnalyticsQuery({});

  // Compute metrics synchronously on render via useMemo to avoid setState in useEffect
  const { userComparePercentage, ordersComparePercentage } = useMemo(() => {
    const calculatePercentage = (
      monthsList: IMonthData[]
    ): IComparePercentage => {
      const currentMonth = monthsList?.[0]?.count ?? 0;
      const previousMonth = monthsList?.[1]?.count ?? 0;

      let percentChange = 0;
      if (previousMonth !== 0) {
        percentChange = ((currentMonth - previousMonth) / previousMonth) * 100;
      } else if (currentMonth !== 0) {
        percentChange = 100;
      }

      return {
        currentMonth,
        previousMonth,
        percentChange,
      };
    };

    const usersMonths: IMonthData[] =
      usersData?.users?.last12Months ??
      usersData?.last12Months ??
      usersData?.usersLast12Months ??
      [];

    const ordersMonths: IMonthData[] =
      ordersData?.orders?.last12Months ??
      ordersData?.last12Months ??
      ordersData?.ordersLast12Months ??
      [];

    return {
      userComparePercentage: calculatePercentage(usersMonths),
      ordersComparePercentage: calculatePercentage(ordersMonths),
    };
  }, [usersData, ordersData]);

  return (
    <DashboardWidgetsPresenter
      open={open}
      isLoading={usersLoading || ordersLoading}
      userComparePercentage={userComparePercentage}
      ordersComparePercentage={ordersComparePercentage}
    />
  );
};

export default DashboardWidgets;