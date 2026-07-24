import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { styles } from "../../../../app/styles/styles";
import { useGetOrdersAnalyticsQuery } from "../../../../redux/features/analytics/analyticsApi";
import Loader from "../../Loader/Loader";

interface MonthData {
  month: string;
  count: number;
}

interface AnalyticsDataItem {
  name: string;
  Count: number;
}

type Props = {
  isDashboard?: boolean;
};

const OrdersAnalytics= ({ isDashboard }: Props) => {
  const { data, isLoading, error } = useGetOrdersAnalyticsQuery({});

  const last12Months: MonthData[] =
    data?.orders?.last12Months ??
    data?.last12Months ??
    data?.ordersLast12Months ??
    [];

  const analyticsData: AnalyticsDataItem[] = last12Months.map((item) => ({
    name: item.month,
    Count: item.count,
  }));

  return (
    <div className={isDashboard ? "h-full" : ""}>
      {isLoading ? (
        <Loader />
      ) : (
        <div className={isDashboard ? "h-full" : "h-[60vh] 800px:h-screen"}>
          <div className={isDashboard ? "mt-0 pl-10 mb-2" : "mt-12.5"}>
            <h1
              className={`${styles.title} ${
                isDashboard ? "text-[20px]!" : ""
              } px-5 text-start!`}
            >
              Orders Analytics
            </h1>
            {!isDashboard && (
              <p className={`${styles.label} px-5`}>
                Last 12 months analytics data
              </p>
            )}
          </div>
          <div
            className={`w-full ${
              !isDashboard ? "h-[90%]" : "h-full"
            } flex items-center justify-center`}
          >
            {error ? (
              <p className="text-black dark:text-white opacity-80 font-Poppins px-5">
                Failed to load orders analytics.
              </p>
            ) : analyticsData.length === 0 ? (
              <p className="text-black dark:text-white opacity-80 font-Poppins px-5">
                No orders analytics data available.
              </p>
            ) : (
              <ResponsiveContainer
                width={isDashboard ? "100%" : "90%"}
                height={isDashboard ? "100%" : "50%"}
              >
                <LineChart
                  data={analyticsData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
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
                  {!isDashboard && <Legend />}
                  <Line type="monotone" dataKey="Count" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersAnalytics;