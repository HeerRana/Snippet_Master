"use client";
import { useUserContext } from "@/context/userContext";
import {
  bookmarkIcon,
  box,
  fire,
  gear,
  help,
  home,
  users,
} from "@/utils/Icons";
import {
  FaExchangeAlt,
  FaRobot,
  FaGithub,
  FaFolder,
  FaAngleDoubleLeft,
} from "react-icons/fa";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { useRouter } from "nextjs-toploader/app";
import { useGlobalContext } from "@/context/globalContext";

function Sidebar() {
  const { user } = useUserContext();
  const { isSidebarOpen, setIsSidebarOpen } = useGlobalContext();

  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    {
      id: 1,
      name: "Home",
      url: "/",
      icon: home,
    },
    {
      id: 2,
      name: "Converter",
      url: "/converter",
      icon: <FaExchangeAlt />,
    },
    {
      id: 3,
      name: "AI Tools",
      url: "/ai-tools",
      icon: <FaRobot />,
    },
    {
      id: 4,
      name: "Popular",
      url: "/popular",
      icon: fire,
    },
    {
      id: 5,
      name: "Top Creators",
      url: `${user ? "/leaderboard" : "/login"}`,
      icon: users,
    },
    {
      id: 2,
      name: "Favourites",
      url: `${user ? "/favourites" : "/login"}`,
      icon: bookmarkIcon,
    },
    {
      id: 3,
      name: "My Snippets",
      url: `${user ? "/snippets" : "/login"}`,
      icon: box,
    },
    {
      id: 7,
      name: "Collections",
      url: `${user ? "/collections" : "/login"}`,
      icon: <FaFolder />,
    },
    {
      id: 6,
      name: "GitHub Gists",
      url: `${user ? "/gist" : "/login"}`,
      icon: <FaGithub />,
    },
    {
      id: 1,
      name: "Settings",
      url: `${user._id ? "/profile/update" : "/login"}`,
      icon: gear,
    },
    {
      id: 2,
      name: "Help",
      url: "/help",
      icon: help,
    },
  ];

  const getIconColor = (url: string) => {
    return pathname === url ? "#aaa" : "#71717a";
  };

  return (
    <div
      style={{ top: "8vh", height: "92vh" }}
      className={`fixed z-20 bg-2 h-full flex flex-col border-r-[2px] border-rgba-3 transition-[width] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[width] ${
        isSidebarOpen ? "w-[15rem]" : "w-[5.2rem]"
      }`}
    >
      <nav className="flex-1 min-h-0 pt-2 flex flex-col justify-between overflow-x-hidden overflow-y-auto no-scrollbar">
        <div className="flex-1 flex flex-col justify-between">
          <ul>
            {menu.slice(0, -2).map((item) => {
              return (
                <li
                  key={`${item.id}-${item.url}`}
                  className={`sidebar-nav-item my-[.1rem] px-8 py-[.42rem] cursor-pointer ${
                    pathname === item.url && "active-nav-item"
                  }`}
                  onClick={() => {
                    router.push(item.url);
                  }}
                >
                  <Link
                    href={item.url}
                    className="grid grid-cols-[40px_1fr] items-center text-[0.9rem] text-gray-200"
                  >
                    <span
                      className="text-lg"
                      style={{ color: getIconColor(item.url) }}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-opacity duration-300 ${
                        isSidebarOpen ? "opacity-100 delay-100" : "opacity-0"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <ul className="mb-2">
            {menu.slice(-2).map((item) => {
              return (
                <li
                  key={`${item.id}-${item.url}`}
                  className={`sidebar-nav-item my-[.1rem] px-8 py-[.42rem] cursor-pointer ${
                    pathname === item.url && "active-nav-item"
                  }`}
                  onClick={() => {
                    router.push(item.url);
                  }}
                >
                  <Link
                    href={item.url}
                    className="grid grid-cols-[40px_1fr] items-center text-[0.9rem] text-gray-200"
                  >
                    <span
                      className="text-lg"
                      style={{ color: getIconColor(item.url) }}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
                        isSidebarOpen ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* collapse / expand, styled like a menu row */}
          <div
            className="sidebar-nav-item sidebar-collapse my-[.1rem] mb-2 px-8 py-[.42rem] cursor-pointer"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <a
              role="button"
              tabIndex={0}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="grid grid-cols-[40px_1fr] items-center text-[0.9rem] text-gray-200"
            >
              <span className="text-lg" style={{ color: "#71717a" }}>
                <FaAngleDoubleLeft
                  className={`transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isSidebarOpen ? "" : "rotate-180"
                  }`}
                />
              </span>
              <span
                className={`whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
                  isSidebarOpen ? "opacity-100" : "opacity-0"
                }`}
              >
                Collapse
              </span>
            </a>
          </div>
        </div>

        {
          <footer
            className={`w-[15rem] shrink-0 overflow-hidden border-rgba-3 text-gray-300 transition-[opacity,max-height,padding] duration-300 ${
              isSidebarOpen
                ? "px-4 py-2 mb-0 border-t-[2px] max-h-[12rem] opacity-100"
                : "p-0 max-h-0 opacity-0 pointer-events-none"
            }`}
          >
            <ul className="flex items-center justify-center gap-4">
              <li>
                <Link
                  href="/terms"
                  className="underline text-xs hover:text-green-400"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="underline text-xs hover:text-green-400"
                >
                  Privacy
                </Link>
              </li>
            </ul>
            <p className="text-center text-xs leading-snug mt-2">
              &copy; {new Date().getFullYear()}{" "}
              <a 
                href="https://portfolio-seven-rho-uo9ad4xd3j.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#7263F3] hover:text-[#6FCF97] transition-colors"
              >
                HeerRana
              </a>
              . All rights reserved.
            </p>
          </footer>
        }
      </nav>
    </div>
  );
}

export default Sidebar;
