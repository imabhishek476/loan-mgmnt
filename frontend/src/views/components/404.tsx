import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-6">
      <div className="bg-white border border-gray-300 shadow-lg rounded-2xl p-10 max-w-md w-full">
        <h1 className="text-7xl font-extrabold text-green-600 tracking-tight mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Sorry, the page you are looking for doesn’t exist or has been moved.
          Please check the URL or return to the dashboard.
        </p>
        <Button
          variant="contained"
          color="success"
          title="Back to Dashboard"
          startIcon={<Home size={18} />}
          onClick={() => navigate("/dashboard")}
          className="!capitalize !rounded-lg !px-6 !py-2.5 !text-white !font-medium shadow-md hover:shadow-lg transition-all duration-300"
        >
          Back to Dashboard
        </Button>
      </div>
      <p className="mt-10 text-gray-400 text-sm">
        © {new Date().getFullYear()} Claim Advance Loan Management. All rights
        reserved.
      </p>
    </div>
  );
};

export default NotFound;
