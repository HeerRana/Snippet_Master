"use client";
import { useUserContext } from "@/context/userContext";
import React from "react";

function LoginForm() {
  const { loginUser, userState, handlerUserInput } = useUserContext();
  const { email, password } = userState;
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <form className="relative m-[2rem] px-10 py-14 rounded-lg bg-2 border border-rgba-3 w-full max-w-[520px] shadow-xl">
      <div className="relative z-10">
        <h1 className="mb-2 text-center text-[1.35rem] font-medium text-white">
          Login to Your Account
        </h1>
        <p className="mb-8 px-[2rem] text-center text-gray-300 text-[14px]">
          Login Now. Don't have an account?{" "}
          <a
            href="/register"
            className="font-bold text-[#6FCF97] hover:text-[#7263F3] transition-all duration-300"
          >
            Register here
          </a>
        </p>

        <div className="mt-[1rem] flex flex-col">
          <label htmlFor="email" className="mb-1 text-gray-300">
            Email
          </label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => handlerUserInput("email")(e)}
            name="email"
            className="px-4 py-3 border-[2px] border-rgba-3 rounded-md outline-[#6FCF97] text-white bg-1 placeholder-gray-400"
            placeholder="someoneexample@gmail.com"
          />
        </div>
        <div className="relative mt-[1rem] flex flex-col">
          <label htmlFor="password" className="mb-1 text-gray-300">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => handlerUserInput("password")(e)}
            name="password"
            className="px-4 py-3 border-[2px] border-rgba-3 rounded-md outline-[#6FCF97] text-white bg-1 placeholder-gray-400"
            placeholder="***************"
          />
          <button
            type="button"
            className="absolute p-1 right-4 top-[43%] text-[22px] text-gray-400 hover:text-white transition-colors"
            onClick={togglePassword}
          >
            {showPassword ? (
              <i className="fas fa-eye-slash"></i>
            ) : (
              <i className="fas fa-eye"></i>
            )}
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <a
            href="/forgot-password"
            className="font-bold text-[#6FCF97] text-[14px] hover:text-[#7263F3] transition-all duration-300"
          >
            Forgot password?
          </a>
        </div>
        <div className="flex">
          <button
            type="submit"
            disabled={!email || !password}
            onClick={loginUser}
            className="mt-[1.5rem] flex-1 px-4 py-3 font-bold bg-[#7263F3] text-white rounded-md hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
          >
            Login Now
          </button>
        </div>
      </div>
      <img src="/flurry.png" alt="" />
    </form>
  );
}

export default LoginForm;
