// import React from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./views/login/Login";
import Dashboard from "./views/dashboard/index";
import Clients from "./views/clients/index";
import Layout from "./views/components/Layout";
import ProtectedRoute from "./views/ProtectedRoute"; 
import  Administration from "./views/administration/index";
import  Loans from "./views/loans/index";
import NotFound from "./views/components/404"; 

const appRouter = createBrowserRouter([
  {
    path: "/login",
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
    { path: "", element: <Navigate to="dashboard" replace /> },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "customer",
        element: <Clients />,
      },
      {
        path: "loans",
        element: <Loans />,
      },
     {
        path: "administration",
        element: <Administration />,
      },
    ],
  },
  { path: "*", element: <NotFound /> },
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
