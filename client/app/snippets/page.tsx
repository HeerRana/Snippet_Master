"use client";
import { useSnippetContext } from "@/context/snippetsContext";
import { useUserContext } from "@/context/userContext";
import { ISnippet } from "@/types/types";
import React, { useEffect } from "react";
import Snippet from "@/components/Snippet/Snippet";
import Categories from "@/components/Categories/Categories";
import useRedirect from "@/hooks/useUserRedirect";

function page() {
  useRedirect("/login");
  const { getUserSnippets, userSnippets } = useSnippetContext();
  const userId = useUserContext().user._id;

  useEffect(() => {
    if (userId) {
      getUserSnippets();
    }
  }, [userId]);

  return (
    <main>
      {userId && <Categories />}
      <div className="px-8 pt-[6.3rem] pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {userSnippets?.snippets?.map((snippet: ISnippet) => {
          return <Snippet key={snippet._id} snippet={snippet} />;
        })}
      </div>{" "}
      {userSnippets?.snippets?.length === 0 && (
        <div className="flex items-center justify-center h-[60vh]">
          <h1 className="text-4xl text-red-400">No snippets found!</h1>
        </div>
      )}
    </main>
  );
}

export default page;
