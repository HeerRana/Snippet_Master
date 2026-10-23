"use client";

import { useSnippetContext } from "@/context/snippetsContext";
import Snippet from "@/components/Snippet/Snippet";
import { ISnippet } from "@/types/types";
import Categories from "@/components/Categories/Categories";
import { next, prev } from "@/utils/Icons";
import { useEffect, useState } from "react";

export default function Home() {
  const { publicSnippets, getTags, getPublicSnippets, setPublicSnippets } = useSnippetContext();
  const [currentPage, setCurrentPage] = useState(1);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleViewMore = () => {
    if (publicSnippets.length > 0 && publicSnippets.length % 10 === 0) {
      setCurrentPage((prevPage) => prevPage + 1); 
    }
  };

  const fetchSnippets = async () => {
    await getPublicSnippets("", "", "", currentPage);
    await getTags();
  };

  useEffect(() => {
    fetchSnippets();
  }, [currentPage]);

  // Note: Real-time updates are handled by the SnippetsContext
  // No need for duplicate listeners here

  return (
    <div className="">
      <Categories />

      <div
        className={`px-8 pt-[6.3rem] pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6`}
      >
        {publicSnippets.map((snippet: ISnippet) => {
          return <Snippet key={snippet._id} snippet={snippet} />;
        })}
      </div>

      {publicSnippets.length === 0 && (
        <div className="flex items-center justify-center h-[60vh]">
          <h1 className="text-4xl text-red-400">No snippets found!</h1>
        </div>
      )}

      <div className="mx-8 flex justify-between">
        <div>
          {currentPage > 1 && (
            <button
              className="mt-2 px-8 py-2 flex items-center gap-2 bg-[#7263F3] rounded-lg shadow-sm font-bold text-white
                hover:bg-[#6BBE92] transition-all duration-300 ease-in-out"
              onClick={handlePrevious}
            >
              <span className="pt-[2px] text-lg">{prev}</span>Previous
            </button>
          )}
        </div>

        <div>
          {publicSnippets.length !== 0 && publicSnippets.length % 10 === 0 && (
            <button
              className="mb-8 mt-2 px-8 py-2 flex items-center gap-2 bg-[#7263F3] rounded-lg shadow-sm font-bold text-white
                hover:bg-[#6BBE92] transition-all duration-300 ease-in-out"
              onClick={handleViewMore}
            >
              View More <span className="pt-[2px] text-lg">{next}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
