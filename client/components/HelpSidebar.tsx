"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

function HelpSidebar() {
  const links = [
    {
      name: "Get Help",
      url: "/help",
    },
    {
      name: "Privacy & Policy",
      url: "/privacy",
    },

    {
      name: "Terms & Conditions",
      url: "/terms",
    },
  ];

  const pathname = usePathname();

  return (
    <div className="py-8 px-6 bg-1 border-r-[2px] border-rgba-3 rounded-tl-md rounded-bl-md  xl:w-[20rem]">
      <nav>
        <ul className="flex flex-col gap-8">
          {links.map((link, index) => (
            <li
              key={index}
              className={`pl-10 text-gray-300 text-sm hover:text-white ${
                pathname === link.url && "text-white active-dot"
              }`}
            >
              <Link href={link.url}>{link.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default HelpSidebar;
