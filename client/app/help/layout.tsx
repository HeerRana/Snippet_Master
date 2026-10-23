import React from "react";

interface Props {
  children: React.ReactNode;
}

function layout({ children }: Props) {
  return (
    <main className="px-6 mx-auto xl:w-[80rem]">
      {children}
      <footer className="mt-6 py-12 flex justify-center items-center">
        <p className="text-center">
          &copy; 2024 <a href="https://harsh810.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[#7263F3] hover:text-[#6FCF97] transition-colors">Harsh810</a>. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

export default layout;
