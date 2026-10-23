"use client";
import Snippet from "@/components/Snippet/Snippet";
import { useSnippetContext } from "@/context/snippetsContext";
import { useUserContext } from "@/context/userContext";
import { ISnippet, IUser } from "@/types/types";
import { joinedOn } from "@/utils/dates";
import { envelope, github, linkedin } from "@/utils/Icons";
import Link from "next/link";
import React, { useEffect } from "react";

interface Props {
  params: {
    id: string;
  };
}

function page({ params: { id } }: Props) {
  const { getUserById } = useUserContext();
  const { getPublicSnippets } = useSnippetContext();

  const [creatorDetails, setCreatorDetails] = React.useState({} as IUser);
  const [snippets, setSnippets] = React.useState([]);

  // get creator id from url
  const creatorId = id.split("-").at(-1);

  useEffect(() => {
    (async () => {
      try {
        const userDetails = await getUserById(creatorId);

        console.log("userDetails", userDetails);

        setCreatorDetails(userDetails);
      } catch (error) {
        console.log("Error fetching creator details", error);
      }
    })();
  }, [creatorId]);

  useEffect(() => {
    if (creatorId) {
      // ensure user id is available before fetching snippets
      (async () => {
        try {
          const res = await getPublicSnippets(creatorId);
          setSnippets(res);
        } catch (error) {
          console.log("Error fetching snippets", error);
        }
      })();
    }
  }, [creatorId]);

  console.log("All snippets", snippets);

  return (
    <main className="min-h-screen pt-24 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-2 to-3 p-8 rounded-2xl border border-rgba-3 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#7263F3] shadow-lg">
                <img
                  src={creatorDetails?.photo || "/image--user.png"}
                  alt={creatorDetails?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#6FCF97] rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-bold text-white mb-2">
                {creatorDetails?.name}
              </h1>
              <p className="text-gray-400 mb-4">
                Joined {joinedOn(creatorDetails?.createdAt)}
              </p>
              
              {/* Bio */}
              <div className="bg-1 p-4 rounded-lg border border-rgba-3 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                <p className="text-gray-300 leading-relaxed">
                  {creatorDetails?.bio || "No bio available"}
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#6FCF97]">{snippets.length}</div>
                  <div className="text-sm text-gray-400">Snippets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#7263F3]">
                    {snippets.reduce((total, snippet: any) => total + (snippet.likes || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#6BBE92]">
                    {Math.floor((Date.now() - new Date(creatorDetails?.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-400">Days Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-8 pt-6 border-t border-rgba-3">
            <h3 className="text-lg font-semibold text-white mb-4 text-center lg:text-left">Connect</h3>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              {creatorDetails?.github && (
                <Link
                  target="_blank"
                  href={creatorDetails.github}
                  className="flex items-center gap-3 px-4 py-2 bg-1 hover:bg-rgba-3 rounded-lg border border-rgba-3 transition-all duration-300 hover:scale-105 group"
                >
                  <span className="text-xl group-hover:text-[#6FCF97] transition-colors">{github}</span>
                  <span className="text-gray-300 group-hover:text-white">GitHub</span>
                </Link>
              )}
              
              {creatorDetails?.linkedin && (
                <Link
                  target="_blank"
                  href={creatorDetails.linkedin}
                  className="flex items-center gap-3 px-4 py-2 bg-1 hover:bg-rgba-3 rounded-lg border border-rgba-3 transition-all duration-300 hover:scale-105 group"
                >
                  <span className="text-xl group-hover:text-[#6FCF97] transition-colors">{linkedin}</span>
                  <span className="text-gray-300 group-hover:text-white">LinkedIn</span>
                </Link>
              )}
              
              {creatorDetails?.publicEmail && (
                <Link
                  target="_blank"
                  href={`mailto:${creatorDetails.publicEmail}`}
                  className="flex items-center gap-3 px-4 py-2 bg-1 hover:bg-rgba-3 rounded-lg border border-rgba-3 transition-all duration-300 hover:scale-105 group"
                >
                  <span className="text-xl group-hover:text-[#6FCF97] transition-colors">{envelope}</span>
                  <span className="text-gray-300 group-hover:text-white">Email</span>
                </Link>
              )}
              
              {!creatorDetails?.github && !creatorDetails?.linkedin && !creatorDetails?.publicEmail && (
                <p className="text-gray-500 italic">No social links available</p>
              )}
            </div>
          </div>
        </div>

        {/* Snippets Section */}
        <div className="bg-2 p-8 rounded-2xl border border-rgba-3 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Snippets by {creatorDetails?.name}
            </h2>
            <p className="text-gray-400">
              {snippets.length} {snippets.length === 1 ? 'snippet' : 'snippets'} created
            </p>
          </div>

          {snippets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {snippets.map((snippet: ISnippet) => (
                <Snippet key={snippet._id} snippet={snippet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-1 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No snippets yet</h3>
              <p className="text-gray-400">This user hasn't created any snippets yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default page;
