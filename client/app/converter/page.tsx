"use client";
import React, { useState } from "react";
import { FaExchangeAlt, FaCopy, FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";

const CodeConverter = () => {
  const [sourceCode, setSourceCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("javascript");
  const [targetLanguage, setTargetLanguage] = useState("python");
  const [isConverting, setIsConverting] = useState(false);

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
    { value: "typescript", label: "TypeScript" },
  ];

  const convertCode = async () => {
    if (!sourceCode.trim()) {
      toast.error("Please enter some code to convert");
      return;
    }

    setIsConverting(true);
    try {
      const converted = await convertCodeWithGemini(sourceCode, sourceLanguage, targetLanguage);
      setConvertedCode(converted);
      toast.success("Code converted successfully!");
    } catch (error) {
      console.error("Error converting code:", error);
      toast.error("Failed to convert code. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const convertCodeWithGemini = async (code: string, from: string, to: string) => {
    try {
      const response = await fetch("https://snippet-master-harsh810.onrender.com/api/v1/convert-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code,
          sourceLanguage: from,
          targetLanguage: to,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to convert code");
      }

      const data = await response.json();
      return data.convertedCode;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const downloadCode = (code: string, language: string) => {
    const element = document.createElement("a");
    const file = new Blob([code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `converted_code.${getFileExtension(language)}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Code downloaded!");
  };

  const getFileExtension = (language: string) => {
    const extensions: { [key: string]: string } = {
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
      swift: "swift",
      kotlin: "kt",
      typescript: "ts",
    };
    return extensions[language] || "txt";
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceCode(convertedCode);
    setConvertedCode("");
  };

  return (
    <div className="p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Code Language Converter</h1>
          <p className="text-gray-300">
            Convert your code between different programming languages instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Source Code Section */}
          <div className="bg-2 p-6 rounded-lg border border-rgba-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Source Code</h2>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="px-3 py-1 bg-1 text-white rounded border border-rgba-3"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                placeholder={`Enter your ${sourceLanguage} code here...`}
                className="w-full h-80 p-4 bg-1 text-white rounded-lg border border-rgba-3 resize-none font-mono text-sm focus:border-[#7263F3] focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(sourceCode)}
                className="absolute top-2 right-2 p-2 bg-rgba-3 text-gray-300 rounded hover:bg-rgba-2 transition-colors"
                title="Copy code"
              >
                <FaCopy />
              </button>
            </div>
          </div>

          {/* Converted Code Section */}
          <div className="bg-2 p-6 rounded-lg border border-rgba-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Converted Code</h2>
              <div className="flex items-center gap-2">
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="px-3 py-1 bg-1 text-white rounded border border-rgba-3"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                {convertedCode && (
                  <button
                    onClick={() => downloadCode(convertedCode, targetLanguage)}
                    className="p-2 bg-rgba-3 text-gray-300 rounded hover:bg-rgba-2 transition-colors"
                    title="Download code"
                  >
                    <FaDownload />
                  </button>
                )}
              </div>
            </div>
            
            <div className="relative">
              {convertedCode ? (
                <div className="relative">
                  <SyntaxHighlighter
                    language={targetLanguage}
                    style={vs2015}
                    customStyle={{
                      height: "320px",
                      fontSize: "14px",
                      background: "#1a1a1a",
                      borderRadius: "8px",
                    }}
                  >
                    {convertedCode}
                  </SyntaxHighlighter>
                  <button
                    onClick={() => copyToClipboard(convertedCode)}
                    className="absolute top-2 right-2 p-2 bg-rgba-3 text-gray-300 rounded hover:bg-rgba-2 transition-colors"
                    title="Copy code"
                  >
                    <FaCopy />
                  </button>
                </div>
              ) : (
                <div className="w-full h-80 p-4 bg-1 text-gray-400 rounded-lg border border-rgba-3 flex items-center justify-center font-mono text-sm">
                  {isConverting ? (
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-[#7263F3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-[#7263F3] font-medium">Converting...</p>
                      <p className="text-gray-500 text-sm mt-1">This usually takes 2-5 seconds</p>
                    </div>
                  ) : (
                    "Converted code will appear here..."
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Convert Button - Centered between windows */}
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center gap-4">
            <button
              onClick={swapLanguages}
              className="p-3 bg-rgba-3 text-gray-300 rounded-full hover:bg-rgba-2 transition-colors"
              title="Swap languages"
            >
              <FaExchangeAlt />
            </button>
            
            <button
              onClick={convertCode}
              disabled={isConverting || !sourceCode.trim()}
              className="px-8 py-3 bg-[#7263F3] text-white rounded-lg hover:bg-[#6FCF97] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
            >
              {isConverting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting...
                </div>
              ) : (
                "Convert Code"
              )}
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-2 p-6 rounded-lg border border-rgba-3 text-center">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-white mb-2">Fast Conversion</h3>
            <p className="text-gray-300">Convert code between 12+ programming languages instantly</p>
          </div>
          
          <div className="bg-2 p-6 rounded-lg border border-rgba-3 text-center">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-white mb-2">Easy Sharing</h3>
            <p className="text-gray-300">Copy or download converted code with one click</p>
          </div>
          
          <div className="bg-2 p-6 rounded-lg border border-rgba-3 text-center">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Conversion</h3>
            <p className="text-gray-300">Intelligent code translation with syntax highlighting</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeConverter; 