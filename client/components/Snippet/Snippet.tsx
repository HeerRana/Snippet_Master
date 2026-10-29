"use client";
import React, { useEffect } from "react";
import { useSnippetContext } from "@/context/snippetsContext";
import { ISnippet } from "@/types/types";
import { formatDate } from "@/utils/dates";
import {
  bookmarkEmpty,
  copy,
  edit,
  heart,
  heartOutline,
  trash,
} from "@/utils/Icons";
import { FaQrcode, FaRobot, FaCodeBranch, FaHistory, FaShareAlt } from "react-icons/fa";
import axios from "axios";
import { API_URL } from "@/utils/apiConfig";
import VersionHistoryModal from "@/components/VersionHistory/VersionHistoryModal";
import ShareLinkModal from "@/components/ShareLinks/ShareLinkModal";
import LineComments, { ILineComment } from "@/components/LineComments/LineComments";
import Image from "next/image";
import Link from "next/link";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs, vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useUserContext } from "@/context/userContext";
import { useGlobalContext } from "@/context/globalContext";
import { useRouter } from "nextjs-toploader/app";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import { useTheme } from "@/context/themeContext";

interface Props {
  snippet: ISnippet;
  height?: string;
  // show line-by-line review comments (snippet detail page only)
  enableComments?: boolean;
  // called after a version restore so the parent can show the new content
  onUpdated?: (snippet: ISnippet) => void;
}

const languageLogo = (language: string) => {
  switch (language) {
    case "c":
      return "/logos/c.png";
    case "c#":
      return "/logos/csharp.svg";
    case "c++":
      return "/logos/cpp.svg";
    case "css":
      return "/logos/css.svg";
    case "django":
      return "/logos/django.svg";
    case "go":
      return "/logos/go.svg";
    case "html":
      return "/logos/html.svg";
    case "java":
      return "/logos/java.svg";
    case "javascript":
      return "/logos/javascript.svg";
    case "json":
      return "/logos/json.svg";
    case "kotlin":
      return "/logos/kotlin.svg";
    case "lua":
      return "/logos/lua.svg";
    case "php":
      return "/logos/php.svg";
    case "python":
      return "/logos/python.svg";
    case "r":
      return "/logos/r.svg";
    case "ruby":
      return "/ruby.svg";
    case "rust":
      return "/logos/rust.svg";
    case "sql":
      return "/logos/sql.svg";
    case "swift":
      return "/logos/swift.svg";
    case "typescript":
      return "/logos/typescript.svg";
    default:
      return "/logos/code.svg";
  }
};

function Snippet({ snippet, height = "400px", enableComments = false, onUpdated }: Props) {
  const userId = useUserContext().user?._id;
  const {
    useBtnColorMemo,
    useTagColorMemo,
    deleteSnippet,
    likeSnippet,
    getPublicSnippets,
  } = useSnippetContext();
  const { openModalForEdit } = useGlobalContext();
  const { theme } = useTheme();

  const router = useRouter();

  // check if current user has liked the snippet
  const [isLiked, setIsLiked] = React.useState(
    snippet.likedBy.includes(userId)
  );
  const [likeCount, setLikeCount] = React.useState(snippet.likedBy.length);
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState("");
  const [showHistory, setShowHistory] = React.useState(false);
  const [showShare, setShowShare] = React.useState(false);
  const [selectedLine, setSelectedLine] = React.useState<number | null>(null);
  const [lineComments, setLineComments] = React.useState<ILineComment[]>([]);

  useEffect(() => {
    if (!enableComments) return;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/snippet/${snippet._id}/comments`, {
          withCredentials: true,
        });
        setLineComments(res.data);
      } catch (error) {
        // comments are optional, the snippet still renders
      }
    })();
  }, [enableComments, snippet._id]);

  const forkSnippet = async () => {
    if (!userId) {
      return router.push("/login");
    }
    try {
      await axios.post(`${API_URL}/snippet/${snippet._id}/fork`, {}, { withCredentials: true });
      toast.success("Forked! It is saved as a private snippet in your account");
      router.push("/snippets");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not fork snippet");
    }
  };

  const codeString = `${snippet?.code}`;

  useEffect(() => {
    if (activeTag) {
      getPublicSnippets("", activeTag);
    }
  }, [activeTag]);

  // handle like/unlike snippet
  const handleLike = async () => {
    if (!userId) {
      return router.push("/login");
    }

    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    await likeSnippet(snippet._id);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(codeString);
    toast.success("Code copied to clipboard");
  };

  const generateQRCode = async () => {
    try {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/snippet/${snippet?.title
        .toLowerCase()
        .split(" ")
        .join("-")}-${snippet?._id}`;
      
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: "#7263F3",
          light: "#FFFFFF"
        }
      });
      
      setQrCodeDataUrl(qrDataUrl);
      setShowShareModal(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const copySnippetLink = async () => {
    try {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/snippet/${snippet?.title
        .toLowerCase()
        .split(" ")
        .join("-")}-${snippet?._id}`;
      
      await navigator.clipboard.writeText(url);
      toast.success("Snippet link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="shadow-sm flex flex-col border-2 border-rgba-3 rounded-lg">
      <div className="px-6 py-4 bg-4 flex items-center justify-between rounded-t-lg border-b-2 border-rgba-3">
        <Link
          href={`/user/${snippet?.user?.name
            ?.toLowerCase()
            .split(" ")
            .join("-")}-${snippet?.user?._id}`}
          className="group transition-all ease-in-out duration-200"
        >
          <div className="flex items-center">
            <Image
              src={snippet?.user?.photo || "/image--useruser.png"}
              alt="user"
              width={40}
              height={40}
              className="rounded-full"
            />
            <h3 className="ml-2 text-gray-300 font-semibold group-hover:text-green-400">
              <span className="group-hover:underline transition-all ease-in-out duration-200">
                {snippet?.user?.name}
              </span>
              <span className="text-sm text-gray-400 font-normal group-hover:text-green-400 group-hover:underline transition-all ease-in-out duration-200">
                , {formatDate(snippet?.createdAt)}
              </span>
            </h3>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-gray-200">
          <button
            className="w-10 h-10 rounded-md text-green-400 text-lg flex items-center justify-center"
            style={{ background: useBtnColorMemo }}
            onClick={copyToClipboard}
          >
            {copy}
          </button>
          <button
            className="w-10 h-10 rounded-md text-green-400 text-lg flex items-center justify-center"
            style={{ background: useBtnColorMemo }}
            onClick={generateQRCode}
            title="Share QR Code"
          >
            <FaQrcode />
          </button>
          <button
            className="w-10 h-10 rounded-md text-green-400 text-lg flex items-center justify-center"
            style={{ background: useBtnColorMemo }}
          >
            {bookmarkEmpty}
          </button>
          <Link
            href={`/snippet/${snippet?.title
              .toLowerCase()
              .split(" ")
              .join("-")}-${snippet?._id}`}
          >
            <button
              className="w-10 h-10 rounded-md text-[#7263F3] text-lg flex items-center justify-center hover:text-[#6BBE92] transition-colors"
              style={{ background: useBtnColorMemo }}
              title="AI Analysis"
            >
              <FaRobot />
            </button>
          </Link>
          <button
            className="w-10 h-10 rounded-md text-green-400 text-lg flex items-center justify-center"
            style={{ background: useBtnColorMemo }}
            onClick={forkSnippet}
            title="Fork this snippet"
          >
            <FaCodeBranch />
          </button>
        </div>
      </div>

      <div>
        <SyntaxHighlighter
          language={snippet?.language}
          showLineNumbers={true}
          wrapLines={enableComments}
          lineProps={
            enableComments
              ? (lineNumber: number) => ({
                  style: {
                    display: "block",
                    cursor: "pointer",
                    borderLeft: lineComments.some((c) => c.line === lineNumber)
                      ? "3px solid #7263F3"
                      : "3px solid transparent",
                    background:
                      selectedLine === lineNumber
                        ? "rgba(114,99,243,0.18)"
                        : undefined,
                  },
                  onClick: () => setSelectedLine(lineNumber),
                })
              : undefined
          }
          style={theme === "light" ? vs : vs2015}
          customStyle={{
            fontSize: "1.2rem",
            background: theme === "light" ? "#f8f9fc" : "#181818",
            borderRadius: "0 0 6px 6px",
            height: height,
            scrollbarWidth: "none",
            overflowX: "scroll",
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>

      {enableComments && (
        <LineComments
          snippetId={snippet._id}
          snippetOwnerId={snippet.user?._id}
          currentUserId={userId}
          selectedLine={selectedLine}
          comments={lineComments}
          onChange={setLineComments}
          onSelectLine={setSelectedLine}
        />
      )}

      <div className="flex-1 px-6 py-2 bg-4 rounded-b-lg border-t-2 border-rgba-3">
        <div className="flex justify-between gap-2">
          <div className="flex-1 flex flex-col">
            <Link
              href={`/snippet/${snippet?.title
                .toLowerCase()
                .split(" ")
                .join("-")}-${snippet?._id}`}
            >
              <div className="flex items-center gap-2">
                <Image
                  src={languageLogo(snippet?.language) || "/logos/c.svg"}
                  width={20}
                  height={20}
                  alt="programming language"
                />
                <h2 className="text-xl font-semibold text-gray-300 cursor-pointer hover:text-green-400 hover:underline transition-all ease-in-out duration-300">
                  {snippet?.title}
                </h2>
              </div>
            </Link>
            {snippet?.forkedFrom && (
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <FaCodeBranch /> forked from{" "}
                <Link
                  href={`/snippet/${snippet.forkedFrom.title
                    .toLowerCase()
                    .split(" ")
                    .join("-")}-${snippet.forkedFrom._id}`}
                  className="text-[#7263F3] hover:underline"
                >
                  {snippet.forkedFrom.title}
                </Link>
              </p>
            )}
            <p className="pb-1 text-gray-400">{snippet?.description}</p>
          </div>
          <button
            className={`flex flex-col items-center text-2xl text-gray-300 ${
              isLiked ? "text-red-500" : "text-gray-300"
            }`}
            onClick={handleLike}
          >
            <span>{isLiked ? heart : heartOutline}</span>
            <span className="text-sm font-bold text-gray-300">
              {likeCount === 0 ? 0 : likeCount}{" "}
              {likeCount === 1 ? "like" : "likes"}
            </span>
          </button>
        </div>
        <div className="pt-2 pb-3 flex justify-between">
          <ul className="items-start flex gap-2 flex-wrap">
            {snippet?.tags.map((tag) => {
              return (
                <li
                  key={tag._id}
                  className="tag-item px-4 py-1 border border-rgba-2 text-gray-300 rounded-md cursor-pointer"
                  style={{ background: useTagColorMemo }}
                  onClick={() => setActiveTag(tag._id)}
                >
                  {tag.name}
                </li>
              );
            })}
          </ul>
          {snippet.user?._id === userId && (
            <div className="flex gap-2">
              <button
                className="w-10 h-10 flex items-center justify-center text-yellow-500 text-lg rounded-md"
                style={{ background: useBtnColorMemo }}
                onClick={() => setShowHistory(true)}
                title="Version history"
              >
                <FaHistory />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center text-[#6BBE92] text-lg rounded-md"
                style={{ background: useBtnColorMemo }}
                onClick={() => setShowShare(true)}
                title="Share link / embed"
              >
                <FaShareAlt />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center text-blue-400 text-xl rounded-md"
                style={{ background: useBtnColorMemo }}
                onClick={() => openModalForEdit(snippet)}
              >
                {edit}
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center text-red-500 text-xl rounded-md"
                style={{ background: useBtnColorMemo }}
                onClick={() => deleteSnippet(snippet._id)}
              >
                {trash}
              </button>
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <VersionHistoryModal
          snippet={snippet}
          onClose={() => setShowHistory(false)}
          onRestored={(restored) =>
            onUpdated ? onUpdated(restored) : window.location.reload()
          }
        />
      )}
      {showShare && (
        <ShareLinkModal snippet={snippet} onClose={() => setShowShare(false)} />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-2 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Share Snippet</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="qr-card bg-white p-3 rounded-lg">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 mb-2">Scan to access this snippet</p>
                <p className="text-sm text-gray-400">{snippet?.title}</p>
              </div>
              
              <div className="flex gap-2 w-full">
                <button
                  onClick={copySnippetLink}
                  className="flex-1 px-4 py-2 bg-[#7263F3] text-white rounded-lg hover:bg-[#6FCF97] transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Snippet;
