import { useState } from "react";
import DashboardHeader from "../Admin/DashboardHeader";
import DashboardWigets from "../Admin/Widgets/DashboardWidgets";


type DashboardHeroProps = {
  isDashboard?: boolean;
};

const DashboardHero = ({ isDashboard }: DashboardHeroProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <DashboardHeader open={open} setOpen={setOpen} />
      {isDashboard && <DashboardWigets open={open} />}
    </div>
  );
};

export default DashboardHero;