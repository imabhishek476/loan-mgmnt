import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { userStore } from "../store/UserStore";
import FullPageLoader from "../components/FullPageLoader";
interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = observer(({ children }) => {
  const [checking, setChecking] = useState(true);

  const checkUser = async () => {
      if (!userStore.user) {
        await userStore.loadUser();
      }
      setChecking(false);
    };


  useEffect(() => {
    checkUser();
  }, []);

  // ⏳ Wait until loadUser completes
  if (checking || userStore.loading) {
    return <FullPageLoader />;
  }

  if (!userStore.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
});

export default ProtectedRoute;
