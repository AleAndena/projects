"use client";
import LottieLoader from "./lottie-loader";

export function LoadingAnalysis({scrapedInfo, llmEvaluation, showCompletion}: {
  scrapedInfo: scrapedInfo | null;
  llmEvaluation: LLMEvaluation | null;
  showCompletion: boolean;
}) {
  return (
    <div className="flex items-center justify-center bg-black">
      <div className="text-center">
        {/* Lottie loader */}
        <div className="mb-6 flex justify-center">
          <LottieLoader size={300} />
        </div>

        {/* Progress bar */}
        <div className="mb-6 w-full bg-gray-800 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${!scrapedInfo ? "33%" : !llmEvaluation ? "66%" : "100%"}`,
            }}
          ></div>
        </div>

        {/* Combined step indicators */}
        <div className="space-y-4 text-center">
          {/* Scraping step */}
          <div
            className={`flex items-center justify-center gap-3 ${
              !scrapedInfo ? "text-white font-semibold text-lg" : "text-gray-400"
            }`}
          >
            {scrapedInfo ? (
              <span className="text-green-400 text-xl">✓</span>
            ) : (
              <span className="animate-bounce text-blue-400 text-2xl">🕵️</span>
            )}
            <span>Scraping site content</span>
          </div>

          {/* Analysis step */}
          <div
            className={`flex items-center justify-center gap-2 ${
              scrapedInfo && !llmEvaluation
                ? "text-white font-semibold text-xl"
                : "text-gray-400"
            }`}
          >
            {llmEvaluation ? (
              <span className="text-green-400 text-2xl">✓</span>
            ) : scrapedInfo ? (
              <span className="animate-pulse text-blue-400 text-2xl">🧠</span>
            ) : null}
            <span>Running AI analysis</span>
          </div>

          {/* Completion step */}
          <div
            className={`flex items-center justify-center gap-3 ${
              showCompletion ? "text-white font-semibold text-xl" : "text-gray-400"
            }`}
          >
            {showCompletion ? (
              <span className="animate-bounce text-green-400 text-2xl">✅</span>
            ) : (
              <span className="opacity-0">✓</span>
            )}
            <span>Analysis complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}