import { Box, Modal } from "@mui/material";
import React from "react";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeItem: unknown;
  LoginComponent: React.ComponentType<{ setOpen: (open: boolean) => void; setRoute: (route: string) => void }>;
  setRoute: (route: string) => void;
};

const CustomModal = ({
  open,
  setOpen,
  activeItem,
  LoginComponent,
  setRoute,
}: Props) => {
  return (
    <Modal
      open={open}
      onClose={() => {
        setOpen(false)
        setRoute("Login")
    }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description">
      <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-112.5 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow p-4 800px:p-5 outline-none">
         <LoginComponent setOpen={setOpen} setRoute={setRoute}/>
      </Box>
    </Modal>
  );
};

export default CustomModal;
