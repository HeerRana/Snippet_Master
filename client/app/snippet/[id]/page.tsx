"use client";
import LoadingSpinner from "@/components/LoadingSpinner";
import Snippet from "@/components/Snippet/Snippet";
import AIAnalysis from "@/components/AIAnalysis/AIAnalysis";
import AIImprovements from "@/components/AIImprovements/AIImprovements";
import AIDocumentation from "@/components/AIDocumentation/AIDocumentation";
import ShareSnippet from "@/components/ShareSnippet/ShareSnippet";
import { useSnippetContext } from "@/context/snippetsContext";
import { ISnippet } from "@/types/types";
import React, { useEffect, useState } from "react";

interface Props {
  params: {
    id: string;
  };
}

function page({ params: { id } }: Props) {
  const { getPublicSnippetById, loading } = useSnippetContext();
  const snippetId = id.split("-").at(-1);

  const [snippet, setSnippet] = useState({} as ISnippet);

  useEffect(() => {
    (async () => {
      const res = await getPublicSnippetById(snippetId);

      setSnippet(res);
    })();
  }, [snippetId]);

  return (
    <main className="p-8 relative min-h-[90vh]">
      {snippet?.title ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{snippet.title}</h1>
            <ShareSnippet snippetId={snippet._id} snippetTitle={snippet.title} />
          </div>
          <Snippet snippet={snippet} height="640px" />
          
          {/* AI Features Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-rgba-3 pb-2">
              🤖 AI-Powered Code Tools
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AIAnalysis code={snippet.code} language={snippet.language} />
              <AIImprovements code={snippet.code} language={snippet.language} />
              <AIDocumentation code={snippet.code} language={snippet.language} />
            </div>
          </div>
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </main>
  );
}

export default page;
