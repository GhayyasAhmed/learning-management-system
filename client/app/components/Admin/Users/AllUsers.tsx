"use client";

import formatTimeAgo from "@/app/utils/formatTimeAgo";
import { Box, Button, Modal } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useTheme } from "next-themes";
import { ChangeEvent, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineDelete, AiOutlineMail } from "react-icons/ai";
import {
  useDeleteUserMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
} from "../../../../redux/features/user/userApi";
import { styles } from "../../../styles/styles";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import Loader from "../../Loader/Loader";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  courses?: unknown[];
  createdAt: string;
}

export interface IRow {
  id: string;
  name: string;
  email: string;
  role: string;
  courses: number;
  created_at: string;
}

interface AllUsersPresenterProps {
  isLoading: boolean;
  rows: IRow[];
  columns: GridColDef[];
  theme: string | undefined;
  active: boolean;
  setActive: (active: boolean) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  email: string;
  setEmail: (email: string) => void;
  setRole: (role: string) => void;
  handleSubmit: () => Promise<void>;
  handleDelete: () => Promise<void>;
}

// ---------------------------------------------------------
// Presenter Component: Pure UI Rendering
// ---------------------------------------------------------
export const AllUsersPresenter = ({
  isLoading,
  rows,
  columns,
  theme,
  active,
  setActive,
  open,
  setOpen,
  email,
  setEmail,
  setRole,
  handleSubmit,
  handleDelete,
}: AllUsersPresenterProps) => {
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="mt-22.5">
      <Box sx={{ margin: "0px" }}>
        <div className="w-full flex justify-end">
          <div
            className={`${styles.button} w-55! dark:bg-[#57c7a3] h-8.75! dark:border-[#ffffffa8] cursor-pointer`}
            onClick={() => setActive(!active)}
          >
            Add New Member
          </div>
        </div>
        <Box
          sx={{
            marginTop: "40px",
            height: "80vh",
            "& .MuiDataGrid-root": {
              border: "none",
              outline: "none",
              backgroundColor: theme === "dark" ? "#1a1b2e" : "#A4A9FC",
            },
            "& .MuiDataGrid-row": {
              color: theme === "dark" ? "#fff" : "#000",
              borderBottom:
                theme === "dark" ? "1px solid #1a1b2e" : "1px solid #ccc!important",
              backgroundColor: theme === "dark" ? "#1e2134" : "#fff",
              "&:hover": {
                backgroundColor:
                  theme === "dark" ? "#252644 !important" : "#f3f4f6 !important",
                color: theme === "dark" ? "#fff !important" : "#000 !important",
                "& .MuiDataGrid-cell": {
                  color: theme === "dark" ? "#fff !important" : "#000 !important",
                },
                "& svg": {
                  color: theme === "dark" ? "#fff !important" : "#000 !important",
                },
              },
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "none!important",
              color: theme === "dark" ? "#fff" : "#000",
            },
            "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderRow": {
              backgroundColor:
                theme === "dark" ? "#4338ca !important" : "#A4A9FC !important",
              color: theme === "dark" ? "#fff !important" : "#000 !important",
              borderBottom: "none",
            },
            "& .MuiDataGrid-columnHeaderTitle, & .MuiDataGrid-columnHeaderTitleContainer": {
              color: theme === "dark" ? "#fff !important" : "#000 !important",
              fontWeight: "600",
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: theme === "dark" ? "#1a1b2e" : "#F2F0F0",
            },
            "& .MuiDataGrid-footerContainer": {
              color: theme === "dark" ? "#fff" : "#000",
              borderTop: "none",
              backgroundColor: theme === "dark" ? "#4338ca" : "#A4A9FC",
            },
            "& .MuiTablePagination-root, & .MuiTablePagination-selectIcon, & .MuiTablePagination-actions": {
              color: theme === "dark" ? "#fff" : "#000",
            },
            "& .MuiDataGrid-menuIcon, & .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon": {
              color: theme === "dark" ? "#fff !important" : "#000 !important",
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

        {/* Update User Role Modal */}
        {active && (
          <Modal
            open={active}
            onClose={() => setActive(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-112.5 bg-white dark:bg-slate-900 rounded-lg shadow p-4 outline-none">
              <h1 className={`${styles.title}`}>Add New Member</h1>
              <div className="mt-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email..."
                  className={`${styles.input}`}
                />
                <select
                  className={`${styles.input} mt-6!`}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setRole(e.target.value)
                  }
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
                <br />
                <div
                  className={`${styles.button} my-6 h-7.5! cursor-pointer`}
                  onClick={handleSubmit}
                >
                  Submit
                </div>
              </div>
            </Box>
          </Modal>
        )}

        {/* Delete User Modal */}
        {open && (
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-112.5 bg-white dark:bg-slate-900 rounded-lg shadow p-4 outline-none">
              <h1 className={`${styles.title}`}>
                Are you sure you want to delete this User?
              </h1>
              <div className="flex w-full items-center justify-between mb-6 mt-4">
                <div
                  className={`${styles.button} w-30! h-7.5 bg-[#47d097] cursor-pointer`}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </div>
                <div
                  className={`${styles.button} w-30! h-7.5 bg-[#d63f3f] cursor-pointer`}
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
  );
};

// ---------------------------------------------------------
// Container Component: Logic, Query & State
// ---------------------------------------------------------
type Props = {
  isTeam?: boolean;
};

const AllUsers = ({ isTeam }: Props) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState<boolean>(false);
  const [active, setActive] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("admin");
  const [userId, setUserId] = useState<string>("");

  const { isLoading, data, refetch } = useGetAllUsersQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );

  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 0.5 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "role", headerName: "Role", flex: 0.5 },
    { field: "courses", headerName: "Purchased Courses", flex: 0.5 },
    { field: "created_at", headerName: "Joined At", flex: 0.5 },
    {
      field: "emailAction",
      headerName: "Email",
      flex: 0.2,
      renderCell: (params: GridRenderCellParams<IRow>) => (
        <div className="flex items-center justify-center w-full h-full">
          <a href={`mailto:${params.row.email}`}>
            <AiOutlineMail className="dark:text-white text-black" size={20} />
          </a>
        </div>
      ),
    },
    {
      field: "deleteAction",
      headerName: "Delete",
      flex: 0.2,
      renderCell: (params: GridRenderCellParams<IRow>) => (
        <Button
          onClick={() => {
            setOpen(true);
            setUserId(params.row.id);
          }}
        >
          <AiOutlineDelete
            className="dark:text-white text-black"
            size={20}
          />
        </Button>
      ),
    },
  ];

  const handleSubmit = async () => {
    const userToUpdate = data?.users?.find(
      (user: IUser) => user.email === email
    );

    if (userToUpdate) {
      try {
        await updateUserRole({ id: userToUpdate._id, role }).unwrap();
        toast.success("User role updated successfully");
        setActive(false);
        setEmail("");
        refetch();
      } catch (err) {
        toast.error(
          getErrorMessage(
            err,
            "Could not update the user's role. Please try again."
          )
        );
      }
    } else {
      toast.error("User not found with this email");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(userId).unwrap();
      toast.success("Delete user successfully!");
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Could not delete the user. Please try again.")
      );
    }
  };

  const usersList: IUser[] = data?.users || [];
  const filteredUsers = isTeam
    ? usersList.filter((user: IUser) => user.role?.toLowerCase() === "admin")
    : usersList;

  const rows: IRow[] = filteredUsers.map((user: IUser) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    courses: user?.courses?.length || 0,
    created_at: formatTimeAgo(user.createdAt),
  }));

  return (
    <AllUsersPresenter
      isLoading={isLoading}
      rows={rows}
      columns={columns}
      theme={theme}
      active={active}
      setActive={setActive}
      open={open}
      setOpen={setOpen}
      email={email}
      setEmail={setEmail}
      setRole={setRole}
      handleSubmit={handleSubmit}
      handleDelete={handleDelete}
    />
  );
};

export default AllUsers;