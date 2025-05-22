"use client";
import { useState } from "react";
import { determineStrengthsAndWeaknesses } from "./utils/utils";
import { getScoreColor, getDescriptionForTopRel } from "./utils/utils";
import { StrengthsWeaknessesDensity } from "@/components/strengths-weaknesses-keywords";
import { LoadingAnalysis } from "@/components/loading-analysis";
import { getExcelFile } from "./utils/csv_utils";
import Image from 'next/image';
import { Header } from "@/components/header";
import { LlmEvalCard } from "@/components/llm-eval-card";
import { TopRelCard } from "@/components/top-rel-card";

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
      
      // reset all the info when a new URL is put in
      setScrapedInfo(null);
      setLlmEvaluation(null);
      setAnalysisResults({ strengths: [], weaknesses: [] })
      setLlmEvalIndex(0);

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
        <div className="flex-1 p-8">
          {/* Main Content */}
          <div className="max-w-6xl mx-auto">

            <Header />

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

            {/* Info Text + CSV Button */}
            <div className="mb-8 flex justify-between items-start">
              {/* Info Text */}
              <div className="text-sm text-gray-400">
                <ul className="space-y-1">
                  <li>• See what LLMs say about your brand and use it to your advantage</li>
                  <li>• If your brand falls short, reach out to us so we can change that for you!</li>
                </ul>
              </div>

              {/* CSV Export Button (only when results exist) */}
              {llmEvaluation && scrapedInfo && (
                <button
                  onClick={() => getExcelFile(llmEvaluation, analysisResults, keywordDensity!)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
                >
                  Export as CSV
                </button>
              )}
            </div>

            {/* Results Grid - only shown when results are available */}
            {llmEvaluation && scrapedInfo && (
              <div>
                {/* Analysis Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  
                  <LlmEvalCard llmEval={llmEvaluation} llmPercentage={LLMpercentage!}/>

                  <TopRelCard topicalRel={topicalRelevance!} topRelPercentage={topRelPercentage!}/>

                  {/* Strengths Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <Image src="/strong.png" alt="flexing bicep logo" width="24" height="24" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <div className="text-2xl font-bold text-white">
                        {analysisResults.strengths.length}
                      </div>
                      <div className="text-sm text-gray-400">STRENGTHS</div>
                    </div>
                  </div>

                  {/* Weaknesses Card */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <Image src="/shield-exclamation.png" alt="shield with exclamation point" width="24" height="24" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <div className="text-2xl font-bold text-white">
                        {analysisResults.weaknesses.length}
                      </div>
                      <div className="text-sm text-gray-400">WEAKNESSES</div>
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
                      <div className="space-y-6" id="llm-evals">
                        {llmEvaluation && arrOfLlmEvaluations ? (
                          arrOfLlmEvaluations[llmEvalIndex]
                        ) : (
                          <p className="text-gray-400 text-lg">No evaluation data available</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between" id="llm-button-container">
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
  );
}