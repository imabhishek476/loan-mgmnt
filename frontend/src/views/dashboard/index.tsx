import { observer } from "mobx-react-lite";
import { userStore } from "../../store/UserStore";

const Dashboard = observer(() => {
  return (
    <div className="text-left flex flex-col bg-white transition-all duration-300">
      <div className="w-full flex flex-col mx-auto mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-700">
              Welcome Back, {userStore.user?.name}
            </h1>
            <p className="text-gray-600 text-base">Welcome to your Claim Advance LMS</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
