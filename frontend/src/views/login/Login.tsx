import { useState, useEffect,useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { observer } from "mobx-react-lite";
import { userStore } from "../../store/UserStore";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import Logo from "../../assets/img/logo/favicon.png";

const Login = observer(() => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const hasLoaded = useRef(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userStore.login(email, password);
      toast.success("Login successful 🎉");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Login failed ❌");
    }
  };
 async function fetchData() {
   await userStore.loadUser();
    if (userStore.user?.name) {
          navigate("/dashboard");
    }
  }
  useEffect(() => {
    if (!hasLoaded.current) {
      fetchData();
      hasLoaded.current = true;
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="Company Logo" className="h-20 w-auto object-contain" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-700 tracking-tight">
          Claim <span className="text-green-700">Advance</span>
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          A professional platform for smart financial solutions
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex items-center border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            <FaEnvelope className="text-green-600 mr-3" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full outline-none text-gray-700 placeholder-gray-400 font-medium"
            />
          </div>

          {/* Password */}
          <div className="flex items-center border border-gray-200 rounded-lg px-4 py-3 shadow-sm relative">
            <FaLock className="text-green-600 mr-3" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full outline-none text-gray-700 placeholder-gray-400 font-medium pr-10"
            />
            <div
              className="absolute right-3 cursor-pointer text-gray-300 hover:text-green-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
            </div>
          </div>

          <button
            type="submit"
            title={userStore.loading ? "Signing In..." : "Sign In"}
            disabled={userStore.loading}
            className={`bg-green-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 tracking-wide ${userStore.loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {userStore.loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
});

export default Login;
