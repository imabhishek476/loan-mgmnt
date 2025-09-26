
import { useAppSelector } from "../../hooks/user";

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.user);

  return (
    <>
      <div className="text-left flex bg-white transition-all duration-300 pl-[70px] lg:pl-0">
        <div className="w-full flex flex-col mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-700">Welcome Back {user?.name}</h1>
            <p className="text-gray-600 text-base">Welcome to your Claim Advance LMS</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
