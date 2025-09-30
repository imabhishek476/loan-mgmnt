import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./views/login/Login";
import Dashboard from "./views/dashboard/index";
import Clients from "./views/clients/index";
import Layout from "./views/components/Layout";
import ProtectedRoute from "./views/ProtectedRoute"; 
import  Administration from "./views/administration/index";

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
        element: <Dashboard />,
      },
      {
        path: "clients",
        element: <Clients />,
      },
        {
        path: "administration",
        element: <Administration />,
      },
    ],
  },
]);

const Body = () => {
  return (
    <>
      <RouterProvider router={appRouter} />
      <ToastContainer />
    </>
  );
};

export default Body;
