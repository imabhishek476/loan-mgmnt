import React from "react";
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { userStore } from "../store/UserStore";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = observer(({ children }) => {
  // If user is not logged in, redirect to login
  if (!userStore.user) {
    return <Navigate to="/" replace />;
  }

  // If logged in, render the children (page/component)
  return children;
});

export default ProtectedRoute;
