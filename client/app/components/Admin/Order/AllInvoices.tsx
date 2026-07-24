import formatTimeAgo from "@/app/utils/formatTimeAgo";
import { Box } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { AiOutlineMail } from "react-icons/ai";
import { useGetAllCourseQuery } from "../../../../redux/features/courses/courseApi";
import { useGetAllOrdersQuery } from "../../../../redux/features/orders/orderApi";
import { useGetAllUsersQuery } from "../../../../redux/features/user/userApi";
import Loader from "../../Loader/Loader";

interface IOrder {
  _id: string;
  userId: string;
  courseId: string;
  createdAt: string;
}

interface IUser {
  _id: string;
  name: string;
  Email: string;
}

interface ICourse {
  _id: string;
  price: number;
}

interface IInvoiceRow {
  id: string;
  userName: string;
  userEmail: string;
  title: string;
  price: string;
  formattedDate: string;
}

type Props = {
  isDashboard?: boolean;
};

const AllInvoices = ({ isDashboard }: Props) => {
  const { theme } = useTheme();
  const { isLoading: ordersLoading, data: OrdersData } = useGetAllOrdersQuery({});
  const { isLoading: usersLoading, data: UsersData } = useGetAllUsersQuery({});
  const { isLoading: coursesLoading, data: CoursesData } = useGetAllCourseQuery({});

  const isLoading = ordersLoading || usersLoading || coursesLoading;

  // Derived synchronously on render via useMemo to avoid setState inside useEffect
  const rows: IInvoiceRow[] = useMemo(() => {
    if (!OrdersData?.orders || !UsersData?.users || !CoursesData?.courses) {
      return [];
    }

    return OrdersData.orders.map((order: IOrder) => {
      const user = UsersData.users.find((u: IUser) => u._id === order.userId);
      const course = CoursesData.courses.find((c: ICourse) => c._id === order.courseId);

      return {
        id: order._id,
        userName: user?.name ?? "N/A",
        userEmail: user?.Email ?? "N/A",
        title: user?.name ?? "N/A",
        price: course ? `$${course.price}` : "N/A",
        formattedDate: formatTimeAgo(order.createdAt),
      };
    });
  }, [OrdersData, UsersData, CoursesData]);

  const columns: GridColDef<IInvoiceRow>[] = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.3 },
      { field: "userName", headerName: "Name", flex: isDashboard ? 0.6 : 0.5 },
      ...(isDashboard
        ? []
        : [
            { field: "userEmail", headerName: "Email", flex: 1 },
            { field: "title", headerName: "Course Title", flex: 1 },
          ]),
      { field: "price", headerName: "Price", flex: 0.5 },
      ...(isDashboard
        ? [{ field: "formattedDate", headerName: "Created At", flex: 0.5 }]
        : [
            {
              field: "actionEmail",
              headerName: "Email",
              flex: 0.2,
              renderCell: (params: GridRenderCellParams<IInvoiceRow>) => (
                <a href={`mailto:${params.row.userEmail}`}>
                  <AiOutlineMail
                    className="dark:text-white text-black"
                    size={20}
                  />
                </a>
              ),
            },
          ]),
    ],
    [isDashboard]
  );

  return (
    <div className={!isDashboard ? "mt-30" : "mt-0"}>
      {isLoading ? (
        <Loader />
      ) : (
        <Box sx={{ margin: isDashboard ? "0" : "40px" }}>
          <Box
            sx={{
              margin: isDashboard ? "0" : "40px 0 0 0",
              height: isDashboard ? "35vh" : "82.49vh",
              overflow: "hidden",
              "& .MuiDataGrid-root": { border: "none", outline: "none" },
              "& .css-pqjvzy-MuiSvgIcon-root-MuiSelect-icon": {
                color: theme === "dark" ? "#fff" : "#000",
              },
              "& .MuiDataGrid-sortIcon": {
                color: theme === "dark" ? "#fff" : "#000",
              },
              "& .MuiDataGrid-row": {
                color: theme === "dark" ? "#fff" : "#000",
                borderBottom:
                  theme === "dark"
                    ? "1px solid #ffffff30!important"
                    : "1px solid #ccc!important",
              },
              "& .MuiTablePagination-root": {
                color: theme === "dark" ? "#fff" : "#000",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none!important",
              },
              "& .name-column--cell": {
                color: theme === "dark" ? "#fff" : "#000",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: theme === "dark" ? "#3e4396" : "#A4A9FC",
                borderBottom: "none",
                color: "#000",
              },
              "& .MuiDataGrid-virtualScroller": {
                backgroundColor: theme === "dark" ? "#1F2A40" : "#F2F0F0",
              },
              "& .MuiDataGrid-footerContainer": {
                color: theme === "dark" ? "#fff" : "#000",
                borderTop: "none",
                backgroundColor: theme === "dark" ? "#3e4396" : "#A4A9FC",
              },
              "& .MuiCheckbox-root": {
                color:
                  theme === "dark" ? `#b7ebde !important` : `#000 !important`,
              },
              "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                color: `${theme === "dark" ? "#fff" : "#000"} !important`,
              },
            }}
          >
            <DataGrid
              checkboxSelection={!isDashboard}
              rows={rows}
              columns={columns}
              slots={isDashboard ? {} : { toolbar: GridToolbar }}
            />
          </Box>
        </Box>
      )}
    </div>
  );
};

export default AllInvoices;