import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/user";
import { login } from "../services/AuthServices";
import { loginSuccess } from "../store/userSlice";
import { toast } from "react-toastify";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import  Logo  from "../assets/img/logo/loans-logo.jpg";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login({ email, password });
      dispatch(loginSuccess(user));
      toast.success("Login successful 🎉");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="min-h-screen flex items-center justify-center w-full bg-gradient-to-br from-green-200 to-green-400 px-4">
  <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
    
    {/* Logo */}
    <div className="flex justify-center">
      <img
        src={Logo} 
        alt="Company Logo"
        className="h-20 w-auto object-contain"
      />
    </div>

    {/* Title */}
    <h1 className="text-3xl font-bold text-center mb-2 text-gray-700 tracking-tight font-sans">
      Loans <span className="text-green-600">Program</span>
    </h1>
    <p className="text-center text-gray-500 text-sm mb-8 font-medium">
      A professional platform for smart financial solutions
    </p>

    {/* Form */}
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Email Field */}
      <div className="flex items-center border border-gray-200 rounded-lg px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-green-400">
        <FaEnvelope className="text-green-500 mr-3" />
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full outline-none text-gray-700 placeholder-gray-400 font-medium"
        />
      </div>

      {/* Password Field */}
      <div className="flex items-center border border-gray-200 rounded-lg px-4 py-3 shadow-sm relative focus-within:ring-2 focus-within:ring-green-400">
        <FaLock className="text-green-500 mr-3" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full outline-none text-gray-700 placeholder-gray-400 font-medium pr-10"
        />
        <div
          className="absolute right-3 cursor-pointer text-gray-300 hover:text-green-600 transition"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`bg-green-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 tracking-wide ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  </div>
</div>


  );
};

export default Login;
