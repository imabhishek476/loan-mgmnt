import { useAppDispatch, useAppSelector } from "../hooks/user";
import { logoutSuccess } from "../store/userSlice";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { logout } from "../services/AuthServices";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.user);
  
  console.log(user,'user');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logoutSuccess());
      toast.info("Logged out successfully 👋");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed ");
    }
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar active="dashboard" onLogout={handleLogout} />

      <main className="flex-1 p-6">
        <h1 className="text-2xl mb-4">Welcome {user?.name}</h1>
        <p>Your role: {user?.role}</p>
      </main>
    </div>
  );
};

export default Dashboard;
