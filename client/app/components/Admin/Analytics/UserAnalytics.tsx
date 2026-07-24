import { FC } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { styles } from "../../../../app/styles/styles";
import { useGetUsersAnalyticsQuery } from "../../../../redux/features/analytics/analyticsApi";
import Loader from "../../Loader/Loader";

interface MonthData {
  month: string;
  count: number;
}

interface AnalyticsDataItem {
  name: string;
  count: number;
}

type Props = {
  isDashboard?: boolean;
};

const UserAnalytics: FC<Props> = ({ isDashboard }) => {
  const { data, isLoading, error } = useGetUsersAnalyticsQuery({});

  const last12Months: MonthData[] =
    data?.users?.last12Months ??
    data?.last12Months ??
    data?.usersLast12Months ??
    [];

  const analyticsData: AnalyticsDataItem[] = last12Months.map((item) => ({
    name: item.month,
    count: item.count,
  }));

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div
          className={`${
            !isDashboard
              ? "mt-12.5"
              : "mt-12.5 dark:bg-[#111C43] shadow-sm pb-5 rounded-sm"
          }`}
        >
          <div className={`${isDashboard ? "ml-8! mb-5" : ""}`}>
            <h1
              className={`${styles.title} ${
                isDashboard ? "text-[20px]!" : ""
              } px-5 text-start!`}
            >
              Users Analytics
            </h1>
            {!isDashboard && (
              <p className={`${styles.label} px-5`}>
                Last 12 months analytics data
              </p>
            )}
          </div>

          <div
            className={`w-full ${
              isDashboard ? "h-65 800px:h-[30vh]" : "h-[60vh] 800px:h-screen"
            } flex items-center justify-center`}
          >
            {error ? (
              <p className="text-black dark:text-white opacity-80 font-Poppins px-5">
                Failed to load users analytics.
              </p>
            ) : analyticsData.length === 0 ? (
              <p className="text-black dark:text-white opacity-80 font-Poppins px-5">
                No users analytics data available.
              </p>
            ) : (
              <ResponsiveContainer
                width={isDashboard ? "100%" : "90%"}
                height={!isDashboard ? "50%" : "100%"}
              >
                <AreaChart
                  data={analyticsData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <XAxis
                    dataKey="name"
                    height={60}
                    interval="preserveStartEnd"
                    angle={-35}
                    textAnchor="end"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#4d62d9"
                    fill="#4d62d9"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UserAnalytics;