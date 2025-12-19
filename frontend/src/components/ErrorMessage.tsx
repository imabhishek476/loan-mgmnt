import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { useRouteError, useNavigate } from "react-router-dom";
import { logFrontendError } from "../services/AuditLogService";

export const ErrorMessage = () => {
  const error: any = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    if (!error) return;

    logFrontendError({
      message: error.message || "Route error",
      stack: error.stack,
      url: window.location.href,
    });
  }, [error]);

  const goToDashboard = async () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800">
          Something went wrong
        </h1>

        <p className="mt-2 text-gray-600">
          We ran into an unexpected issue. Our team has been notified.
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white"
          >
            <RefreshCcw size={16} />
            Try Again
          </button>

          <button
            onClick={goToDashboard}
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5"
          >
            <Home size={16} />
            Go to Dashboard
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">Error Code: 500</p>
      </div>
    </div>
  );
};
