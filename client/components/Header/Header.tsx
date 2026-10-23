"use client";
import { useUserContext } from "@/context/userContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import SearchInput from "../SearchInput/SearchInput";
import { login, register } from "@/utils/Icons";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/context/globalContext";
import SearchIcon from "@/public/Icons/SearchIcon";
import { useRealTime } from "@/context/realTimeContext";

function Header() {
  const { user } = useUserContext();
  const { openModalForSnippet, openProfileModal, openModalForSearch } =
    useGlobalContext();
  
  const { isConnected } = useRealTime();

  const photo = user?.photo;
  const router = useRouter();

  return (
    <div className="fixed z-20 top-0 w-full px-8 flex items-center justify-between bg-1 border-b-[2px] border-rgba-2 h-[8vh]">
      <Link href="/" className="flex items-center">
        <Image
          src="/logo.png"
          alt="Snippy Logo"
          width={120}
          height={40}
          className="object-contain"
          priority
        />
      </Link>

      <div className="lg:flex hidden items-center gap-4">
        <SearchInput />
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {!user._id ? (
        <div className="flex items-center gap-3">
          <button
            className="relative h-[42px] px-6 bg-transparent border-2 border-[#7263F3] text-[#7263F3] flex items-center justify-center gap-2 rounded-lg font-semibold hover:bg-[#7263F3] hover:text-white transition-all duration-300 ease-in-out group"
            onClick={() => router.push("/login")}
          >
            <span className="text-lg group-hover:scale-110 transition-transform duration-300">{login}</span>
            <span>Login</span>
          </button>
          <button
            className="relative h-[42px] px-6 bg-gradient-to-r from-[#7263F3] to-[#6BBE92] text-white flex items-center justify-center gap-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#7263F3]/25 hover:scale-105 transition-all duration-300 ease-in-out group"
            onClick={() => router.push("/register")}
          >
            <span className="text-lg group-hover:rotate-12 transition-transform duration-300">{register}</span>
            <span>Get Started</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            className="mr-4 h-[42px] px-4 flex items-center justify-center text-black bg-white rounded-lg font-semibold hover:bg-white/80 transition duration-200 ease-in-out"
            onClick={openModalForSnippet}
          >
            Create Snippet
          </button>

          <button
            onClick={openModalForSearch}
            className="w-[42px] h-[42px] flex items-center justify-center bg-rgba-3 rounded-lg lg:hidden"
          >
            <SearchIcon stroke="rgba(249,249,249,0.6)" />
          </button>

          <button
            onClick={openProfileModal}
            className="w-[43px] h-[42px] flex items-center justify-center bg-rgba-3 rounded-lg"
          >
            <Image
              src={photo || "/image--user.png"}
              alt="profile"
              width={35}
              height={35}
              className="rounded-lg"
            />
          </button>
        </div>
      )}
    </div>
  );
}

export default Header;
