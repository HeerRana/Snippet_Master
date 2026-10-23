"use client";
import React, { useState } from "react";
import AIAnalysis from "@/components/AIAnalysis/AIAnalysis";
import AIImprovements from "@/components/AIImprovements/AIImprovements";
import AIDocumentation from "@/components/AIDocumentation/AIDocumentation";
import { FaCode, FaLightbulb, FaFileAlt, FaExchangeAlt } from "react-icons/fa";

const AIToolsPage = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [activeTab, setActiveTab] = useState("analysis");

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
    { value: "c", label: "C" },
    { value: "css", label: "CSS" },
    { value: "html", label: "HTML" },
    { value: "sql", label: "SQL" },
  ];

  const tabs = [
    { id: "analysis", label: "Code Analysis", icon: FaCode },
    { id: "improvements", label: "Code Improvements", icon: FaLightbulb },
    { id: "documentation", label: "Documentation", icon: FaFileAlt },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // You can add toast notification here if needed
    } catch (error) {
      console.error("Failed to copy code");
    }
  };

  const clearCode = () => {
    setCode("");
  };

  return (
    <div className="p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🤖 AI-Powered Code Tools</h1>
          <p className="text-gray-300">
            Analyze, improve, and document your code with advanced AI assistance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Input Section */}
          <div className="bg-2 p-6 rounded-lg border border-rgba-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Input Code</h2>
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1 bg-1 text-white rounded border border-rgba-3"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-rgba-3 text-gray-300 rounded hover:bg-rgba-2 transition-colors"
                  title="Copy code"
                >
                  Copy
                </button>
                <button
                  onClick={clearCode}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  title="Clear code"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code here to analyze, improve, or document..."
              className="w-full h-96 p-4 bg-1 text-white rounded-lg border border-rgba-3 resize-none font-mono text-sm focus:border-[#7263F3] focus:outline-none"
            />
          </div>

          {/* AI Tools Section */}
          <div className="bg-2 p-6 rounded-lg border border-rgba-3">
            <h2 className="text-xl font-semibold text-white mb-4">AI Tools</h2>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-1 p-1 rounded-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#7263F3] text-white"
                        : "text-gray-300 hover:text-white hover:bg-rgba-3"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === "analysis" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaCode className="w-5 h-5" />
                    Code Analysis
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Get comprehensive analysis including quality score, security concerns, performance tips, and best practices.
                  </p>
                  <AIAnalysis code={code} language={language} />
                </div>
              )}

              {activeTab === "improvements" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaLightbulb className="w-5 h-5" />
                    Code Improvements
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Get specific improvement suggestions with code examples and alternative approaches.
                  </p>
                  <AIImprovements code={code} language={language} />
                </div>
              )}

              {activeTab === "documentation" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaFileAlt className="w-5 h-5" />
                    Documentation Generator
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Generate comprehensive documentation including function descriptions, parameters, and usage examples.
                  </p>
                  <AIDocumentation code={code} language={language} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-2 p-6 rounded-lg border border-rgba-3 text-center">
            <FaCode className="w-8 h-8 text-[#7263F3] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Code Analysis</h3>
            <p className="text-gray-400 text-sm">
              Get quality scores, security insights, and performance recommendations for your code.
            </p>
          </div>
          
          <div className="bg-2 p-6 rounded-lg border border-rgba-3 text-center">
            <FaLightbulb className="w-8 h-8 text-[#7263F3] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Smart Improvements</h3>
            <p className="text-gray-400 text-sm">
              Receive specific suggestions with code examples to enhance your code quality.
            </p>
          </div>
          
          <div className="bg-2 p-6 rounded-lg border border-rgba-3 text-center">
            <FaFileAlt className="w-8 h-8 text-[#7263F3] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Auto Documentation</h3>
            <p className="text-gray-400 text-sm">
              Generate comprehensive documentation with function descriptions and usage examples.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIToolsPage; 