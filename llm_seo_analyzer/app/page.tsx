"use client";
import { useState } from "react";
import { determineStrengthsAndWeaknesses } from "./utils/utils";
import { getPDF, getScoreColor } from "./utils/utils";
import { StrengthsWeaknesses } from "@/components/strengths-weaknesses";
import { KeywordDensityDisplay } from "@/components/keyword-density-display";
import { LoadingAnalysis } from "@/components/loading-analysis";
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
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">OpenAI</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                      <path d="M12 8V16" stroke="white" strokeWidth="2"/>
                      <path d="M8 12H16" stroke="white" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">Claude</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">Google AI</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 18L20 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M4 12L20 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M4 6L20 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
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
                      <div className="mr-4">
                        <div className={`text-2xl font-bold ${llmEvaluation.ranking.score <= 2 ? "text-red-500" : "text-white"}`}>
                          {llmEvaluation.ranking.score}/5 (Poor)
                        </div>
                        <div className="text-sm text-gray-400 mt-1">LLM Evaluation</div>
                      </div>
                    </div>
                  </div>

                  {/* Topical Relevance Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="text-2xl font-bold text-blue-500">
                          9/10 (Good)
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Topical Relevance</div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div>
                        <div className="text-2xl font-bold text-white">
                          2
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
                          5
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Weaknesses</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Analysis Panels */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Left Panel - Evaluating Questions */}
                  <div className="col-span-5 bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4">Evaluating Questions</h2>
                    <div className="space-y-6">
                      {llmEvaluation.ranking.questions.map((q, i) => (
                        <div key={i} className="border-b border-gray-700 pb-6">
                          <p className="text-sm text-white">
                            What is the best web scraping framework that is fast and powerful for large-scale data extraction?
                          </p>
                          <div className="border-t border-gray-700 my-3"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel - Analysis Tabs */}
                  <div className="col-span-7 bg-gray-800 p-6 rounded-lg border border-gray-700">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-700 mb-4">
                      <button className="px-4 py-2 text-white border-b-2 border-white font-medium">Strengths</button>
                      <button className="px-4 py-2 text-gray-400 hover:text-white">Weaknesses</button>
                      <button className="px-4 py-2 text-gray-400 hover:text-white">Keyword Density</button>
                    </div>

                    {/* Tab Content */}
                    <div>
                      {/* This would be populated based on active tab */}
                    </div>
                  </div>
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