import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./views/components/Layout";
import Login from "./views/login/Login";
import Dashboard from "./views/dashboard/index";
import Clients from "./views/clients";
import ProtectedRoute from "./views/ProtectedRoute";
import { ToastContainer } from "react-toastify";

const Body = () => {
  return (
    <>
      <RouterProvider router={appRouter} />
      <ToastContainer />
    </>
  );
};

const appRouter = createBrowserRouter([

  {
    path: "/",
    element: <Login />,
  },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "clients",
        element: (
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        ),
      },
    ],
  },

]);

export default Body;
