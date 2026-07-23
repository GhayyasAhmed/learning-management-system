import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
export default function useAuth() {
  const { user } = useSelector((state: RootState) => state.auth);
  // Only treat a real user as authenticated (guest/null/empty should be logged out)
  return !!user && typeof user === "object" && !!user._id;
}