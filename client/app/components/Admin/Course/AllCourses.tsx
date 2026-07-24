"use client";
import formatTimeAgo from "@/app/utils/formatTimeAgo";
import { Box, Button, Modal } from "@mui/material";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineDelete } from "react-icons/ai";
import { FiEdit2 } from "react-icons/fi";
import {
  useDeleteCourseMutation,
  useGetAllCourseQuery,
} from "../../../../redux/features/courses/courseApi";
import Loader from "../../../components/Loader/Loader";
import { styles } from "../../../styles/styles";
import { getErrorMessage } from "../../../utils/getErrorMessage";

interface ICourse {
  _id: string;
  name: string;
  ratings: number;
  purchased: number;
  createdAt: string;
}

interface IRow {
  id: string;
  title: string;
  ratings: number;
  purchased: number;
  created_at: string;
}

const AllCourses = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const { isLoading, data, refetch } = useGetAllCourseQuery(
    {},
    { refetchOnMountOrArgChange: true },
  );
  const [deleteCourse] = useDeleteCourseMutation({});

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "title", headerName: "Course Title", flex: 1 },
    { field: "ratings", headerName: "Ratings", flex: 0.5 },
    { field: "purchased", headerName: "Purchased", flex: 0.5 },
    { field: "created_at", headerName: "Created At", flex: 0.5 },
    {
      field: "  ",
      headerName: "Edit",
      flex: 0.2,
      renderCell: (params: GridRenderCellParams<IRow>) => {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Link href={`/admin/edit-course/${params.row.id}`}>
              <FiEdit2 className="dark:text-white text-black" size={20} />
            </Link>
          </div>
        );
      },
    },
    {
      field: " ",
      headerName: "Delete",
      flex: 0.2,
      renderCell: (params: GridRenderCellParams<IRow>) => {
        return (
          <>
            <Button
              onClick={() => {
                setOpen(!open);
                setCourseId(params.row.id);
              }}
            >
              <AiOutlineDelete
                className="dark:text-white text-black"
                size={20}
              />
            </Button>
          </>
        );
      },
    },
  ];
  const rows: IRow[] = [];
  if (data?.courses) {
    data.courses.forEach((course: ICourse) => {
      rows.push({
        id: course._id,
        title: course.name,
        ratings: course.ratings,
        purchased: course.purchased,
        created_at: formatTimeAgo(course.createdAt),
      });
    });
  }

  console.log(data);

  const handleDelete = async () => {
    try {
      await deleteCourse(courseId).unwrap();
      setOpen(false); // Closes modal strictly on successful deletion
      refetch();
      toast.success("Course Deleted Successfully");
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Could not delete the course. Please try again."),
      );
    }
  };
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="mt-22.5">
          <Box sx={{ margin: "0px" }}>
            <Box
              sx={{
                marginTop: "40px",
                height: "80vh",
                "& .MuiDataGrid-root": {
                  border: "none",
                  outline: "none",
                  backgroundColor: theme === "dark" ? "#1a1b2e" : "#A4A9FC",
                },
                "& .css-pqjvzy-MuiSvgIcon-root-MuiSelect-icon": {
                  color: theme === "dark" ? "#fff" : "#000",
                },
                "& .MuiDataGrid-sortIcon": {
                  color: theme === "dark" ? "#fff" : "#000",
                },
                "& .MuiDataGrid-row": {
                  color: theme === "dark" ? "#fff" : "#000",
                  borderBottom:
                    theme === "dark" ? "#1a1b2e" : "1px solid #ccc!important",
                  backgroundColor: theme === "dark" ? "#1e2134" : "#fff",
                  "&:hover": {
                    backgroundColor:
                      theme === "dark"
                        ? "#252644 !important"
                        : "#f3f4f6 !important",
                    color:
                      theme === "dark" ? "#fff !important" : "#000 !important",
                    "& .MuiDataGrid-cell": {
                      color:
                        theme === "dark"
                          ? "#fff !important"
                          : "#000 !important",
                    },
                    "& svg": {
                      color:
                        theme === "dark"
                          ? "#fff !important"
                          : "#000 !important",
                    },
                  },
                },
                "& .MuiTablePagination-root": {
                  color: theme === "dark" ? "#fff" : "#000",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "none!important",
                  color: theme === "dark" ? "#fff" : "#000",
                },
                "& .name-column--cell": {
                  color: theme === "dark" ? "#fff" : "#000",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: theme === "dark" ? "#000" : "#A4A9FC",
                  borderBottom: "none",
                  color: theme === "dark" ? "##fff" : "#000",
                  fontWeight: "600",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  color: theme === "dark" ? "#000" : "#000",
                  fontWeight: "600",
                },
                "& .MuiDataGrid-columnHeader": {
                  color: theme === "dark" ? "#000" : "#000",
                  backgroundColor: theme === "dark" ? "#4338ca" : "#A4A9FC",
                  "&:focus, &:focus-within": {
                    outline: "none",
                  },
                },
                "& .MuiDataGrid-virtualScroller": {
                  backgroundColor: theme === "dark" ? "#1a1b2e" : "#F2F0F0",
                },
                "& .MuiDataGrid-footerContainer": {
                  color: theme === "dark" ? "#fff" : "#000",
                  borderTop: "none",
                  backgroundColor: theme === "dark" ? "#4338ca" : "#A4A9FC",
                },

                "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                  color:
                    theme === "dark" ? "#fff !important" : "#000 !important",
                },
                "& .MuiDataGrid-toolbar": {
                  backgroundColor: theme === "dark" ? "#4338ca" : "#A4A9FC",
                  color: theme === "dark" ? "#fff" : "#000",
                },
                "& .MuiDataGrid-toolbarContainer": {
                  backgroundColor: theme === "dark" ? "#4338ca" : "#A4A9FC",
                },
                "& .MuiDataGrid-selectedRowCount": {
                  color: theme === "dark" ? "#fff" : "#000",
                },
                "& .MuiDataGrid-menuIcon": {
                  color: theme === "dark" ? "#fff" : "#000",
                },
                "& .MuiDataGrid-iconButtonContainer": {
                  color: theme === "dark" ? "#fff" : "#000",
                },
              }}
            >
              <DataGrid
                checkboxSelection
                rows={rows}
                columns={columns}
                sx={{
                  border:
                    theme === "dark"
                      ? "1px solid rgba(255, 255, 255, 0.1)"
                      : "1px solid #ccc",
                }}
              />
            </Box>

            {open && (
              <Modal
                open={open}
                onClose={() => setOpen(!open)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-112.5 bg-white dark:bg-slate-900 rounded-lg shadow p-4 outline-none">
                  <h1 className={`${styles.title}`}>
                    Are you sure you want to delete this course?
                  </h1>
                  <div className="flex w-full items-center justify-between mb-6 mt-4">
                    <div
                      className={`${styles.button} w-30! h-7.5 bg-[#47d097]`}
                      onClick={() => setOpen(!open)}
                    >
                      Cancel
                    </div>
                    <div
                      className={`${styles.button} w-30! h-7.5 bg-[#d63f3f]`}
                      onClick={handleDelete}
                    >
                      Delete
                    </div>
                  </div>
                </Box>
              </Modal>
            )}
          </Box>
        </div>
      )}
    </>
  );
};

export default AllCourses;
