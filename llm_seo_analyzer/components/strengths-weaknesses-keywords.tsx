"use client";
import { useState } from "react";
import { KeywordDensityDisplay } from "./keyword-density-display";

export function StrengthsWeaknessesDensity({
  strengths,
  weaknesses,
  keywordDensity
}: {
  strengths: strengthWeakness[];
  weaknesses: strengthWeakness[];
  keywordDensity: keywordDensityObj[]
}) {
  const [activeTab, setActiveTab] = useState<"strengths" | "weaknesses" | "keywords">(
    "strengths"
  );
  const [strengthsPage, setStrengthsPage] = useState(0);
  const [weaknessesPage, setWeaknessesPage] = useState(0);
  const [keywordsPage, setKeywordsPage] = useState(0);

  // Compute page counts (2 items per page)
  const strengthsPageCount = Math.ceil(strengths.length / 2);
  const weaknessesPageCount = Math.ceil(weaknesses.length / 2);
  const keywordsPageCount = Math.ceil(keywordDensity.length / 2);

  // Handlers for pagination
  function handlePrev() {
    if (activeTab === "strengths") {
      setStrengthsPage((p) => Math.max(p - 1, 0));
    } else if (activeTab === "weaknesses") {
      setWeaknessesPage((p) => Math.max(p - 1, 0));
    } else {
      setKeywordsPage((p) => Math.max(p - 1, 0));
    }
  }

  function handleNext() {
    if (activeTab === "strengths") {
      setStrengthsPage((p) => Math.min(p + 1, strengthsPageCount - 1));
    } else if (activeTab === "weaknesses") {
      setWeaknessesPage((p) => Math.min(p + 1, weaknessesPageCount - 1));
    } else {
      setKeywordsPage((p) => Math.min(p + 1, keywordsPageCount - 1));
    }
  }

  // Prepare the lists as arrays of JSX
  const strengthItems = strengths.map((item, idx) => (
    <div
      key={idx}
      className="border-l-4 border-green-500 pl-4 py-2 bg-gray-700 rounded-r-lg"
    >
      <h3 className="font-medium text-white">{item.name}</h3>
      <p className="text-sm text-gray-300 mt-1">{item.message}</p>
    </div>
  ));

  const weaknessItems = weaknesses.map((item, idx) => (
    <div
      key={idx}
      className="border-l-4 border-red-500 pl-4 py-2 bg-gray-700 rounded-r-lg"
    >
      <h3 className="font-medium text-white">{item.name}</h3>
      <p className="text-sm text-gray-300 mt-1">{item.message}</p>
    </div>
  ));

  const keywordItems = keywordDensity.map((kw, i) => (
    <KeywordDensityDisplay
      key={i}
      keyword={kw.keyword}
      densityAsPercent={kw.densityAsPercent}
      count={kw.count}
    />
  ));

  // Content for current page (2 items per page)
  let content;
  if (activeTab === "strengths") {
    if (strengths.length === 0) {
      content = <p className="text-gray-400 italic">No strengths detected.</p>;
    } else {
      const start = strengthsPage * 2;
      content = strengthItems.slice(start, start + 2);
    }
  } else if (activeTab === "weaknesses") {
    if (weaknesses.length === 0) {
      content = <p className="text-gray-400 italic">No weaknesses detected.</p>;
    } else {
      const start = weaknessesPage * 2;
      content = weaknessItems.slice(start, start + 2);
    }
  } else {
    if (keywordDensity.length === 0) {
      content = <p className="text-gray-400 italic">No keywords detected.</p>;
    } else {
      const start = keywordsPage * 2;
      content = keywordItems.slice(start, start + 2);
    }
  }

  // Disabled state for pagination buttons
  const atStart =
    activeTab === "strengths"
      ? strengthsPage === 0
      : activeTab === "weaknesses"
      ? weaknessesPage === 0
      : keywordsPage === 0;
  const atEnd =
    activeTab === "strengths"
      ? strengthsPage === strengthsPageCount - 1
      : activeTab === "weaknesses"
      ? weaknessesPage === weaknessesPageCount - 1
      : keywordsPage === keywordsPageCount - 1;

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col h-[75vh] min-h-[75vh]">
      <h2 className="text-xl font-semibold mb-4 text-white">
        Site Analysis Summary
      </h2>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab("strengths")}
          className={`py-2 px-4 font-medium text-sm mr-2 transition-colors duration-200 ${
            activeTab === "strengths"
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Strengths ({strengths.length})
        </button>
        <button
          onClick={() => setActiveTab("weaknesses")}
          className={`py-2 px-4 font-medium text-sm transition-colors duration-200 ${
            activeTab === "weaknesses"
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Weaknesses ({weaknesses.length})
        </button>
        <button
          onClick={() => setActiveTab("keywords")}
          className={`py-2 px-4 font-medium text-sm transition-colors duration-200 ${
            activeTab === "keywords"
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Keyword Density
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow space-y-4 overflow-y-auto">
        {Array.isArray(content) ? content : <>{content}</>}
      </div>

      {/* Pagination Buttons */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handlePrev}
          disabled={atStart}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <button
          onClick={handleNext}
          disabled={atEnd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}