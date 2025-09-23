import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/user";
import type { JSX } from "react";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAppSelector((state) => state.user);

  if (!user) return <Navigate to="/" replace />; // redirect if not logged in
  return children;
};

export default ProtectedRoute;
