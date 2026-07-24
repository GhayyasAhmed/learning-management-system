import {
  Bar,
  BarChart,
  Label,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { styles } from "../../../../app/styles/styles";
import { useGetCoursesAnalyticsQuery } from "../../../../redux/features/analytics/analyticsApi";
import Loader from "../../Loader/Loader";

export interface IAnalyticsItem {
  month: string;
  count: number;
}

export interface IChartData {
  name: string;
  uv: number;
}

const CourseAnalytics = () => {
  const { data, isLoading, error } = useGetCoursesAnalyticsQuery({});

  const last12Months: IAnalyticsItem[] =
    data?.course?.last12Months ??
    data?.last12Months ??
    data?.coursesLast12Months ??
    [];

  const analyticsData: IChartData[] = last12Months.map(
    (item: IAnalyticsItem) => ({
      name: item.month,
      uv: item.count,
    }),
  );

  const minValue = 0;

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="h-screen">
          <div className="mt-12.5">
            <h1 className={`${styles.title} px-5 text-start!`}>
              Courses Analytics
            </h1>
            <p className={`${styles.label} px-5`}>
              Last 12 months analytics data
            </p>
          </div>

          <div className="w-full h-[90%] flex items-center justify-center">
            {error ? (
              <p className="text-black dark:text-white opacity-80 font-Poppins px-5">
                Failed to load courses analytics.
              </p>
            ) : analyticsData.length === 0 ? (
              <p className="text-black dark:text-white opacity-80 font-Poppins px-5">
                No courses analytics data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="50%">
                <BarChart width={150} height={300} data={analyticsData}>
                  <XAxis dataKey="name">
                    <Label offset={0} position="insideBottom" />
                  </XAxis>
                  <YAxis domain={[minValue, "auto"]} />
                  <Bar dataKey="uv" fill="#3faf82">
                    <LabelList dataKey="uv" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CourseAnalytics;
