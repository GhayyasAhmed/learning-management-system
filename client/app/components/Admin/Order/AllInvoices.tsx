import formatTimeAgo from "@/app/utils/formatTimeAgo";
import { Box, Modal } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from "@mui/x-data-grid";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { AiOutlineEye, AiOutlineMail } from "react-icons/ai";
import { useGetAllCourseQuery } from "../../../../redux/features/courses/courseApi";
import { useGetAllOrdersQuery } from "../../../../redux/features/orders/orderApi";
import { useGetAllUsersQuery } from "../../../../redux/features/user/userApi";
import { styles } from "../../../styles/styles";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import Loader from "../../Loader/Loader";

interface IOrder {
  _id: string;
  userId: string;
  courseId: string;
  createdAt: string;
  paymentInfo?: Record<string, unknown>;
}

interface IUser {
  _id: string;
  name: string;
  // Email: string;
  email?: string;
}

interface ICourse {
  _id: string;
  name?: string;
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

interface ISelectedInvoice {
  orderId: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  price: string;
  date: string;
  paymentInfo?: Record<string, unknown>;
}

type Props = {
  isDashboard?: boolean;
};

const AllInvoices = ({ isDashboard }: Props) => {
  const { theme } = useTheme();
  const {
    isLoading: ordersLoading,
    data: OrdersData,
    error: ordersError,
  } = useGetAllOrdersQuery({});
  const { isLoading: usersLoading, data: UsersData } = useGetAllUsersQuery({});
  const { isLoading: coursesLoading, data: CoursesData } = useGetAllCourseQuery(
    {},
  );

  const [selectedInvoice, setSelectedInvoice] =
    useState<ISelectedInvoice | null>(null);

  const isLoading = ordersLoading || usersLoading || coursesLoading;

  // Memoize data extractions to prevent new array references on every render
  const orders: IOrder[] = useMemo(
    () => OrdersData?.orders ?? [],
    [OrdersData],
  );
  const users: IUser[] = useMemo(() => UsersData?.users ?? [], [UsersData]);
  const courses: ICourse[] = useMemo(
    () => CoursesData?.courses ?? [],
    [CoursesData],
  );

  const rows: IInvoiceRow[] = useMemo(() => {
    if (!orders.length) return [];

    return orders.map((order: IOrder) => {
      const user = users.find((u: IUser) => u._id === order.userId);
      const course = courses.find((c: ICourse) => c._id === order.courseId);

      return {
        id: order._id,
        userName: user?.name ?? "N/A",
        userEmail: user?.email ?? "N/A",
        title: course?.name ?? "N/A",
        price: course ? `$${course.price}` : "N/A",
        formattedDate: formatTimeAgo(order.createdAt),
      };
    });
  }, [orders, users, courses]);

  const handleViewDetails = (orderId: string) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;
    const user = users.find((u: IUser) => u._id === order.userId);
    const course = courses.find((c: ICourse) => c._id === order.courseId);

    setSelectedInvoice({
      orderId: order._id,
      userName: user?.name ?? "N/A",
      userEmail: user?.email ?? "N/A",
      courseTitle: course?.name ?? "N/A",
      price: course ? `$${course.price}` : "N/A",
      date: new Date(order.createdAt).toLocaleString(),
      paymentInfo: order.paymentInfo,
    });
  };

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
              field: "actionDetails",
              headerName: "Details",
              flex: 0.2,
              sortable: false,
              filterable: false,
              renderCell: (params: GridRenderCellParams<IInvoiceRow>) => (
                <button
                  type="button"
                  aria-label="View invoice details"
                  onClick={() => handleViewDetails(params.row.id)}
                  className="cursor-pointer flex items-center justify-center w-full h-full"
                >
                  <AiOutlineEye
                    className="dark:text-white text-black"
                    size={20}
                  />
                </button>
              ),
            },
            {
              field: "actionEmail",
              headerName: "Email",
              flex: 0.2,
              renderCell: (params: GridRenderCellParams<IInvoiceRow>) => (
                <div className="flex items-center justify-center w-full h-full">
                  <a
                    href={`mailto:${params.row.userEmail}`}
                    aria-label="Email customer"
                  >
                    <AiOutlineMail
                      className="dark:text-white text-black"
                      size={20}
                    />
                  </a>
                </div>
              ),
            },
          ]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDashboard, orders, users, courses],
  );

  return (
    <div className={!isDashboard ? "mt-30" : "mt-0"}>
      {isLoading ? (
        <Loader />
      ) : ordersError ? (
        <p className="text-black dark:text-white opacity-80 font-Poppins px-5 py-10 text-center">
          {getErrorMessage(ordersError, "Failed to load invoices.")}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-black dark:text-white opacity-80 font-Poppins px-5 py-10 text-center">
          No invoices found.
        </p>
      ) : (
        <Box sx={{ margin: isDashboard ? "0" : "40px" }}>
          <Box
            sx={{
              margin: isDashboard ? "0" : "40px 0 0 0",
              height: isDashboard ? "35vh" : "82.49vh",
              overflow: "hidden",
              "& .MuiDataGrid-menuIcon": {
                "& .MuiIconButton-root": {
                  color:
                    theme === "dark" ? "#fff !important" : "#000 !important",
                  "&:hover": {
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(255, 255, 255, 0.15) !important"
                        : "rgba(0, 0, 0, 0.04) !important",
                  },
                },
              },
              "& .MuiDataGrid-iconButtonContainer": {
                "& .MuiIconButton-root": {
                  color:
                    theme === "dark" ? "#fff !important" : "#000 !important",
                  "&:hover": {
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(255, 255, 255, 0.15) !important"
                        : "rgba(0, 0, 0, 0.04) !important",
                  },
                },
              },
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
                "&:hover": {
                  backgroundColor:
                    theme === "dark"
                      ? "#2a3752 !important"
                      : "#e0e0e0 !important",
                },
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
              "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderRow":
                {
                  backgroundColor:
                    theme === "dark"
                      ? "#3e4396 !important"
                      : "#A4A9FC !important",
                  color:
                    theme === "dark" ? "#fff !important" : "#000 !important",
                  borderBottom: "none",
                },
              "& .MuiDataGrid-columnHeaderTitle": {
                color: theme === "dark" ? "#fff !important" : "#000 !important",
                fontWeight: "600",
              },
              "& .MuiDataGrid-columnSeparator": {
                color:
                  theme === "dark"
                    ? "#ffffff50 !important"
                    : "#00000050 !important",
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

      {selectedInvoice && (
        <Modal
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          aria-labelledby="invoice-details-title"
        >
          <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-137.5 max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow p-4 800px:p-6 outline-none">
            <h1
              id="invoice-details-title"
              className={`${styles.title} text-start!`}
            >
              Invoice Details
            </h1>
            <div className="font-Poppins text-black dark:text-white space-y-2 mt-4 text-[15px]">
              <p>
                <span className="font-semibold">Order ID:</span>{" "}
                {selectedInvoice.orderId}
              </p>
              <p>
                <span className="font-semibold">Customer:</span>{" "}
                {selectedInvoice.userName}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {selectedInvoice.userEmail}
              </p>
              <p>
                <span className="font-semibold">Course:</span>{" "}
                {selectedInvoice.courseTitle}
              </p>
              <p>
                <span className="font-semibold">Price:</span>{" "}
                {selectedInvoice.price}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {selectedInvoice.date}
              </p>
            </div>
            {selectedInvoice.paymentInfo && (
              <div className="mt-4">
                <h5 className="font-semibold font-Poppins text-black dark:text-white mb-2">
                  Payment Info
                </h5>
                <pre className="text-[12px] whitespace-pre-wrap break-all bg-[#0000000d] dark:bg-[#ffffff0d] p-3 rounded font-Poppins text-black dark:text-white">
                  {JSON.stringify(selectedInvoice.paymentInfo, null, 2)}
                </pre>
              </div>
            )}
            <div className="w-full flex justify-end mt-6">
              <button
                type="button"
                className={`${styles.button} w-30! h-8.75 cursor-pointer`}
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </button>
            </div>
          </Box>
        </Modal>
      )}
    </div>
  );
};

export default AllInvoices;
