"use client";
// Sidebar UI components
import { Box, IconButton, Typography } from "@mui/material";
import { Menu, MenuItem, ProSidebar } from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
//custom Icons
import { RootState } from "@/redux/store";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import avatarDefault from "../../../../public/assets/avatardefault.jpg";
import { useLogoutUserQuery } from "../../../../redux/features/auth/authApi";
import { userLoggedOut } from "../../../../redux/features/auth/authSlice";
import {
    ArrowBackIosIcon,
    ArrowForwardIosIcon,
    BarChartOutlinedIcon,
    ExitToAppIcon,
    GroupsIcon,
    HomeOutlinedIcon,
    ManageHistoryIcon,
    MapOutlinedIcon,
    OndemandVideoIcon,
    PeopleOutlinedIcon,
    QuizIcon,
    ReceiptOutlinedIcon,
    VideoCallIcon,
    WebIcon,
    WysiwygIcon,
} from "./Icons";

type itemProps = {
  title: string;
  to: string;
  icon: React.ReactElement;
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
};

const emptySubscribe = () => () => {};
const useIsMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

// A reusable sidebar link component
const Item = ({ title, to, icon, selected, setSelected }: itemProps) => {
  return (
    <MenuItem
      active={selected === title}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography className="text-[16px]! font-Poppins!">{title}</Typography>
      <Link href={to} />
    </MenuItem>
  );
};

const AdminSideBar = () => {
  const mounted = useIsMounted();
  const { data: session } = useSession();
  const { user } = useSelector((state: RootState) => state.auth);
  const userData = typeof user === "object" && user !== null ? user : null;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");

  const { theme } = useTheme();
  const [logout, setLogout] = useState(false);
  const { } = useLogoutUserQuery(undefined, { skip: !logout });
  const dispatch = useDispatch();

  const logoutHandler = async () => {
    setLogout(true);
    if (session) {
      await signOut();
    }
    dispatch(userLoggedOut());
    toast.success("Logged out successfuldasdly!");
    // toast.success("Logged out successfully!");
    // try {
    //   await logoutUser(undefined).unwrap();
    // } catch (err) {
    //   console.log("Logout request failed (continuing local logout):", err);
    // } finally {
    //   dispatch(userLoggedOut());
    //   toast.success("Logged out successfully!");
    //   // End NextAuth session too (prevents automatic re-login on refresh)
    //   await signOut({ redirect: true, callbackUrl: "/" });
    // }
  };

//   useEffect(() => {
//     if (isLogoutSuccess) {
//       dispatch(userLoggedOut());
//       toast.success("Logged out successfuldasdly!");
//     }
//   }, [isLogoutSuccess, dispatch]);

  if (!mounted) {
    return null;
  }

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${
            theme === "dark" ? "#111C43 !important" : "#fff !important"
          }`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
          opacity: 1,
        },
        "& .pro-menu-item": {
          color: `${theme !== "dark" && "#000"}`,
        },
      }}
      className="bg-white! dark:bg-[#111C43]"
    >
      <ProSidebar
        collapsed={isCollapsed}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 99999999999999,
          width: isCollapsed ? "0vh" : "30vh",
        }}
      >
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <ArrowForwardIosIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
            }}
          >
            {!isCollapsed && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  ml: "10px",
                }}
              >
                <Link href="/" className="block">
                  <h3 className="text-[25px] font-Poppins uppercase dark:text-white text-black">
                    ELearning
                  </h3>
                </Link>
                <IconButton
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="inline-block"
                >
                  <ArrowBackIosIcon className="text-black dark:text-[#ffffffc1]" />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box sx={{ mb: "25px" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  alt="profile-user"
                  width={100}
                  height={100}
                  src={userData?.avatar ? userData.avatar.url : avatarDefault}
                  className="w-20 h-20 rounded-full cursor-pointer"
                  style={{
                    cursor: "pointer",
                    borderRadius: "50%",
                    border: "3px solid #5b6fe6",
                  }}
                />
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h4"
                  className="text-[20px]! text-black dark:text-[#ffffffc1]"
                  sx={{ m: "10px 0 0 0" }}
                >
                  {userData?.name}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ m: "10px 0 0 0" }}
                  className="text-[20px]! text-black dark:text-[#ffffffc1] capitalize"
                >
                  - {userData?.role}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ paddingLeft: isCollapsed ? undefined : "8%" }}>
            <Item
              title="Dashboard"
              to="/admin"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h5"
              sx={{ m: "15px 0 5px 25px" }}
              className="text-[18px]! text-black dark:text-[#ffffffc1] capitalize font-normal!"
            >
              {!isCollapsed && "Data"}
            </Typography>
            <Item
              title="Users"
              to="/admin/users"
              icon={<GroupsIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Invoices"
              to="/admin/invoices"
              icon={<ReceiptOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h5"
              className="text-[18px]! text-black dark:text-[#ffffffc1] capitalize font-normal!"
              sx={{ m: "15px 0 5px 20px" }}
            >
              {!isCollapsed && "Content"}
            </Typography>
            <Item
              title="Create Course"
              to="/admin/create-course"
              icon={<VideoCallIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Live Courses"
              to="/admin/courses"
              icon={<OndemandVideoIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h5"
              className="text-[18px]! text-black dark:text-[#ffffffc1] capitalize font-normal!"
              sx={{ m: "15px 0 5px 20px" }}
            >
              {!isCollapsed && "Customization"}
            </Typography>
            <Item
              title="Hero"
              to="/admin/hero"
              icon={<WebIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="FAQ"
              to="/admin/faq"
              icon={<QuizIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Categories"
              to="/admin/categories"
              icon={<WysiwygIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h5"
              className="text-[18px]! text-black dark:text-[#ffffffc1] capitalize font-normal!"
              sx={{ m: "15px 0 5px 20px" }}
            >
              {!isCollapsed && "Controllers"}
            </Typography>
            <Item
              title="Manage Team"
              to="/admin/team"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              className="text-[18px]! text-black dark:text-[#ffffffc1] capitalize font-normal!"
              sx={{ m: "15px 0 5px 20px" }}
            >
              {!isCollapsed && "Analytics"}
            </Typography>
            <Item
              title="Courses Analytics"
              to="/admin/courses-analytics"
              icon={<BarChartOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Orders Analytics"
              to="/admin/orders-analytics"
              icon={<MapOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Users Analytics"
              to="/admin/users-analytics"
              icon={<ManageHistoryIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              className="text-[18px]! text-black dark:text-[#ffffffc1] capitalize font-normal!"
              sx={{ m: "15px 0 5px 20px" }}
            >
              {!isCollapsed && "Extras"}
            </Typography>
            <div onClick={logoutHandler}>
              <Item
                title="Logout"
                to="/"
                icon={<ExitToAppIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </div>
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default AdminSideBar;
