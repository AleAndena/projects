"use client";
import { useState } from "react";
import { determineStrengthsAndWeaknesses } from "./utils/utils";
import { getPDF, getScoreColor, getDescriptionForLlmEvaluation, getDescriptionForTopRel } from "./utils/utils";
import { StrengthsWeaknessesDensity } from "@/components/strengths-weaknesses-keywords";
import { LoadingAnalysis } from "@/components/loading-analysis";

// Disable static generation
export const dynamic = 'force-dynamic'

export default function Home() {
  // URL submission state
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [clickedSubmit, setClickedSubmit] = useState(false);

  // Analysis state
  const [scrapedInfo, setScrapedInfo] = useState<scrapedInfo | null>(null);
  const [llmEvaluation, setLlmEvaluation] = useState<LLMEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{ strengths: strengthWeakness[], weaknesses: strengthWeakness[] }>({ strengths: [], weaknesses: [] });
  const [llmEvalIndex, setLlmEvalIndex] = useState(0);

  async function scrapeAndAnalyze(urlToCheck: string) {
    try {
      setLoading(true);
      setShowCompletion(false);
      // get an object containing the scraped information of the site
      const formattedScrapingUrl = `/api/scrape/${encodeURIComponent(urlToCheck)}`;
      const response = await fetch(formattedScrapingUrl);
      const doc = await response.json();
      console.log('SCRAPED INFORMATION', doc.data);
      setScrapedInfo(doc.data);
      // remove structuredData and topicalRelevance since the llm-url-check does not need that info
      const scrapedInfoFormattedForLlmCheck = {
        ...doc.data,
        url: urlToCheck
      };
      delete scrapedInfoFormattedForLlmCheck.structuredData;
      delete scrapedInfoFormattedForLlmCheck.topicalRelevance;
      // make a request to the LLM-URL-checker to get an evaluation
      const scoring = await fetch('/api/llm-url-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapedInfoFormattedForLlmCheck)
      });
      const score = await scoring.json();
      console.log('LLM Evaluation using scraped info', score);
      setLlmEvaluation(score);
      setShowCompletion(true);
      // Calculate strengths and weaknesses once we have all the data
      if (doc.data && score) {
        const results = determineStrengthsAndWeaknesses({
          scrapedInfo: doc.data,
          llmEvaluation: score
        });
        setAnalysisResults(results);
      }
      // Wait 1 second before showing full analysis for smoother transition between loading screen and analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error in scraping and analysis:', error);
    } finally {
      setLoading(false);
    }
  }
  // check if input is a valid URL
  function validateURL(): boolean {
    // idea taken from: https://medium.com/@tariibaba/javascript-check-if-string-is-url-ddf98d50060a
    try {
      // add a check to see if it already has `https://` or not
      // ideally we just do `setUrl()` with the fixed URL then use `url`, but react doesn't let us do that for performance reasons
      let urlToCheck = url;
      if (!url.includes("https://")) {
        urlToCheck = "https://" + urlToCheck;
        setUrl(urlToCheck);
      }
      new URL(urlToCheck);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  // handle the index state for the llm evluation
  function incrementLlmEvalIndex() {
    if (llmEvalIndex < 4) {
      setLlmEvalIndex(llmEvalIndex + 1);
    }
  }
  // handle the index state for the llm evluation
  function decrementLlmEvalIndex() {
    if (llmEvalIndex > 0) {
      setLlmEvalIndex(llmEvalIndex - 1);
    }
  }

  // handle URL submission
  async function handleSubmission(event: React.FormEvent): Promise<undefined> {
    event.preventDefault();
    setClickedSubmit(true);
    // check if new url is valid
    const isValidUrl = validateURL();
    setIsValid(isValidUrl);
    // if url is valid, analyze the corresponding page 
    if (isValidUrl) {
      // add a check to see if it already has `https://` or not
      let urlToCheck = url;
      if (!url.includes("https://")) {
        urlToCheck = "https://" + urlToCheck;
      }
      // call the analysis function
      await scrapeAndAnalyze(urlToCheck);
    }
  }
  const topicalRelevance: topicalRelevance | undefined = scrapedInfo?.topicalRelevance;
  const keywordDensity: [keywordDensityObj] | undefined = scrapedInfo?.keywordDensity;
  const LLMpercentage = llmEvaluation ? (llmEvaluation.ranking.score / 5) * 100 : null;
  const topRelPercentage = topicalRelevance ? (topicalRelevance.score / 10) * 100 : null;
  const arrOfLlmEvaluations = llmEvaluation ? llmEvaluation.ranking.questions.map((q, i) => (
    <div key={i} className="border-l-6 border-blue-600 pl-3">
      <p className="font-medium text-gray-200">{q.question}</p>
      <div className="mt-2 text-sm">
        <p className="text-gray-300">
          <span className="font-semibold text-gray-200">Did the AI recommend your URL: </span>
          {q.foundUrlMatch ? (
            <span className="inline-block font-semibold text-green-400">Yes</span>
          ) : (
            <span className="inline-block font-semibold text-red-400">No</span>
          )}
        </p>
        {q.llmRecommendedUrls.length > 0 && (
          <div className="mt-1">
            <span className="font-semibold text-gray-200">Recommended URLs:</span>
            <ul className="list-disc pl-5 mt-1">
              {q.llmRecommendedUrls.map((url: string, idx: number) => (
                <li key={idx} className="text-gray-300 text-sm break-all">{url}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-16 bg-black min-h-screen border-r border-gray-800 flex flex-col items-center py-6 space-y-6">
          <div className="p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
              <path d="M7 7h10v3H7z"></path>
              <path d="M7 12h2v5H7z"></path>
              <path d="M12 12h5v5h-5z"></path>
            </svg>
          </div>
          <div className="p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="9"></rect>
              <rect x="14" y="7" width="3" height="5"></rect>
            </svg>
          </div>
          <div className="p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">LLM SEO Analyzer</h1>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm">
                  work with us
                </button>
              </div>
              <p className="text-gray-400 mt-2">
                Instantly see how your site ranks in LLMs & search engines. Our SEO LLM Analyzer shows you how often your site is actually recommended by AI-and why.
              </p>

              {/* LLM Icons */}
              <div className="flex space-x-4 mt-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">OpenAI</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                      <path d="M12 8V16" stroke="white" strokeWidth="2" />
                      <path d="M8 12H16" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">Claude</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">Google AI</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 18L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <path d="M4 12L20 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <path d="M4 6L20 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">Bing</span>
                </div>
              </div>
            </div>

            {/* URL Input */}
            <div className="mb-8">
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
                Enter your website URL
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setIsValid(false)
                    setClickedSubmit(false)
                  }}
                  placeholder="e.g.,   https://www.example.com"
                  className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSubmission}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-r font-medium"
                >
                  Analyze
                </button>
              </div>
              {!isValid && clickedSubmit && (
                <p className="mt-1 text-sm text-red-400">Please enter a valid URL (e.g., https://example.com, example.com)</p>
              )}
            </div>

            {/* Info Text */}
            <div className="mb-8 text-sm text-gray-400">
              <ul className="space-y-1">
                <li>• See what LLMs say about your brand and use it to your advantage</li>
                <li>• If your brand falls short, reach out to us so we can change that for you!</li>
              </ul>
            </div>

            {/* Results Grid - only shown when results are available */}
            {llmEvaluation && scrapedInfo && (
              <div>
                {/* Analysis Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {/* LLM Evaluation Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {/* https://daisyui.com/components/radial-progress/ */}
                        {/* Donut graph to show the score */}
                        <div className={`radial-progress ${llmEvaluation.ranking.score <= 2 ? "text-secondary" : "text-primary"} mr-4`}
                          style={{ "--value": LLMpercentage!, "--size": "4vw", "--thickness": "0.7vw" } as React.CSSProperties}
                          aria-valuenow={LLMpercentage!}
                          role="progressbar">
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {llmEvaluation.ranking.score}/5 {getDescriptionForLlmEvaluation(llmEvaluation.ranking.score)}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">LLM Evaluation</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Topical Relevance Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {/* https://daisyui.com/components/radial-progress/ */}
                        {/* Donut graph to show the score */}
                        <div className={`radial-progress ${topicalRelevance!.score <= 6 ? "text-secondary" : "text-primary"} mr-4`}
                          style={{ "--value": topRelPercentage!, "--size": "4vw", "--thickness": "0.7vw" } as React.CSSProperties}
                          aria-valuenow={topRelPercentage!}
                          role="progressbar">
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {topicalRelevance!.score}/10 {getDescriptionForTopRel(topicalRelevance!.score)}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Topical Relevance</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {analysisResults.strengths.length}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Strengths</div>
                      </div>
                    </div>
                  </div>

                  {/* Weaknesses Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {analysisResults.weaknesses.length}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Weaknesses</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {/* LLM Evaluation Section */}
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col h-[75vh] min-h-[75vh]">
                    <h2 className="text-xl font-semibold mb-6 text-white">LLM Evaluation</h2>
                    <div className="mb-8">
                      <div className="flex items-baseline space-x-4">
                        <span className="text-4xl font-bold my-2 inline-block">
                          <span className={getScoreColor(llmEvaluation.ranking.score)}>
                            {llmEvaluation.ranking.score}/5
                          </span>
                        </span>
                        <span className="text-gray-200 text-lg">Overall Score</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-6">
                        {llmEvaluation && arrOfLlmEvaluations ? (
                          arrOfLlmEvaluations[llmEvalIndex]
                        ) : (
                          <p className="text-gray-400 text-lg">No evaluation data available</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={decrementLlmEvalIndex}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={llmEvalIndex === 0}
                      >
                        Prev
                      </button>
                      <button
                        onClick={incrementLlmEvalIndex}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={llmEvalIndex >= 4}
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {/* Strengths and Weaknesses Analysis */}
                  <StrengthsWeaknessesDensity
                    strengths={analysisResults.strengths}
                    weaknesses={analysisResults.weaknesses}
                    keywordDensity={keywordDensity!}
                  />
                </div>

                {/* PDF Export Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={getPDF}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <LoadingAnalysis
                scrapedInfo={scrapedInfo}
                llmEvaluation={llmEvaluation}
                showCompletion={showCompletion}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}