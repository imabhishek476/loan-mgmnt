import { useAppSelector } from "../../hooks/user";

const Clients = () => {
  const { user } = useAppSelector((state) => state.user);

  return (
    <div className="min-h-screen flex items-left justify-center px-2 py-8 sm:px-0">
      <div className="w-full bg-white rounded-xl shadow-md flex flex-col mx-auto sm:p-8">
        <h1 className="text-xl sm:text-2xl font-semibold mb-2 text-left">
          Client Management
        </h1>
        <p className="text-gray-600 mb-6 sm:mb-8 text-left text-sm sm:text-base">
          Manage client records and personal information
        </p>
        <div className="flex grow bg-gray-100 rounded-lg shadow-inner p-5 sm:p-8 flex-col justify-between">
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <svg
              className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 1 7 7M12 14a7 7 0 0 0-7 7"
              />
            </svg>
            <h2 className="text-base sm:text-lg text-gray-700 mb-2">
              No clients yet
            </h2>
            <p className="text-gray-500 mb-5 text-sm sm:text-base">
              Get started by adding your first client
            </p>
            <button className="bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 sm:px-5 rounded transition duration-150 w-full sm:w-auto">
              + Add First Client
            </button>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-4 text-center sm:text-right">
            Your role:{" "}
            <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
