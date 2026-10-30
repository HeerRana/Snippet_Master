"use client";
import React, { useRef, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs, vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";
import { FaCamera, FaDownload, FaCopy } from "react-icons/fa";
import { ISnippet } from "@/types/types";

interface Props {
  snippet: ISnippet;
  onClose: () => void;
}

const BACKGROUNDS = [
  { name: "Violet", css: "linear-gradient(135deg,#7263F3,#6BBE92)" },
  { name: "Sunset", css: "linear-gradient(135deg,#f093fb,#f5576c)" },
  { name: "Ocean", css: "linear-gradient(135deg,#4facfe,#00f2fe)" },
  { name: "Night", css: "linear-gradient(135deg,#232526,#414345)" },
  { name: "Clean", css: "#f3f4f8" },
];

// Export a snippet as a styled image for Twitter / LinkedIn. Rendered in the
// browser with html-to-image, nothing is uploaded anywhere.
function ScreenshotModal({ snippet, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [bg, setBg] = useState(BACKGROUNDS[0].css);
  const [dark, setDark] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [busy, setBusy] = useState(false);

  const render = async () => {
    if (!cardRef.current) throw new Error("Nothing to render");
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  };

  const download = async () => {
    setBusy(true);
    try {
      const dataUrl = await render();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${snippet.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      a.click();
    } catch (error) {
      toast.error("Could not create the image");
    } finally {
      setBusy(false);
    }
  };

  const copyImage = async () => {
    setBusy(true);
    try {
      const dataUrl = await render();
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Image copied");
    } catch (error) {
      toast.error("Copying images is not supported here, use Download");
    } finally {
      setBusy(false);
    }
  };

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm border transition-colors ${
      active
        ? "bg-[#7263F3] text-white border-[#7263F3]"
        : "border-rgba-1 text-gray-300 hover:bg-rgba-3"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-2 p-6 rounded-lg shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <FaCamera /> Export as image
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.name}
              onClick={() => setBg(b.css)}
              className={chip(bg === b.css)}
            >
              {b.name}
            </button>
          ))}
          <span className="mx-1 text-gray-500">|</span>
          <button onClick={() => setDark(true)} className={chip(dark)}>
            Dark code
          </button>
          <button onClick={() => setDark(false)} className={chip(!dark)}>
            Light code
          </button>
          <button onClick={() => setShowTitle((v) => !v)} className={chip(showTitle)}>
            Title
          </button>
        </div>

        <div className="overflow-auto rounded-lg">
          <div
            ref={cardRef}
            className="shot-card"
            style={
              {
                background: bg,
                padding: 40,
                "--shot-code": dark ? "#181818" : "#ffffff",
              } as React.CSSProperties
            }
          >
            <div
              style={{
                background: dark ? "#181818" : "#ffffff",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  background: dark ? "#252526" : "#f1f2f6",
                }}
              >
                <span style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f56" }} />
                <span style={{ width: 12, height: 12, borderRadius: 6, background: "#ffbd2e" }} />
                <span style={{ width: 12, height: 12, borderRadius: 6, background: "#27c93f" }} />
                {showTitle && (
                  <span
                    style={{
                      marginLeft: 12,
                      fontSize: 14,
                      fontFamily: "system-ui, sans-serif",
                      color: dark ? "#cccccc" : "#374151",
                    }}
                  >
                    {snippet.title}
                  </span>
                )}
              </div>
              <SyntaxHighlighter
                language={snippet.language}
                style={dark ? vs2015 : vs}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  padding: "16px 20px",
                  fontSize: "1rem",
                  background: dark ? "#181818" : "#ffffff",
                }}
              >
                {snippet.code}
              </SyntaxHighlighter>
            </div>
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontFamily: "system-ui, sans-serif",
                color: bg === "#f3f4f8" ? "#6b7280" : "rgba(255,255,255,0.85)",
              }}
            >
              <span>Made with</span>
              {/* logo.png is a 1024px square with the wordmark in the middle, so it is
                  cropped with a background image instead of scaling the whole file */}
              <span
                role="img"
                aria-label="Snippy"
                style={{
                  display: "inline-block",
                  width: 65,
                  height: 15,
                  backgroundImage: "url(/logo.png)",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "85px 85px",
                  backgroundPosition: "-10.3px -34.6px",
                  filter:
                    bg === "#f3f4f8" ? "invert(1) hue-rotate(180deg)" : undefined,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={copyImage}
            disabled={busy}
            className="px-4 py-2 flex items-center gap-2 rounded-md border-2 border-[#7263F3] text-[#7263F3] font-semibold hover:bg-[#7263F3] hover:text-white transition-colors disabled:opacity-50"
          >
            <FaCopy /> Copy
          </button>
          <button
            onClick={download}
            disabled={busy}
            className="px-4 py-2 flex items-center gap-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
          >
            <FaDownload /> {busy ? "Working…" : "Download PNG"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScreenshotModal;
