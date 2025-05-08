"use client";

import { useState } from "react";
import { determineStrengthsAndWeaknesses } from "./analysis/[url]/utils";
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
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-md bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6">URL Submission</h1>

        <form onSubmit={handleSubmission} className="space-y-4">
          <div>
            <label htmlFor="url" className="text-sm text-gray-300 mb-1 block">
              Enter a full URL
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setIsValid(false)
                setClickedSubmit(false)
              }}
              placeholder="https://example.com"
              className={`w-full px-4 py-2 bg-gray-800 text-white border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${!isValid && clickedSubmit ? 'border-red-500' : 'border-gray-700'
                }`}
            />
            {!isValid && clickedSubmit && (
              <p className="mt-1 text-sm text-red-400">Please enter a valid URL (e.g., https://example.com, example.com)</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Submit URL
          </button>
        </form>

        {isValid && (
          <div className="mt-6 p-4 bg-gray-800 rounded-md border border-gray-700">
            <p className="text-green-400 font-medium">Submitted URL:</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              {url}
            </a>
          </div>
        )}
      </div>

      {loading &&
        <LoadingAnalysis
          scrapedInfo={scrapedInfo}
          llmEvaluation={llmEvaluation}
          showCompletion={showCompletion}
        />
      }

      {scrapedInfo && llmEvaluation &&
        <div id="analysis-page" className="p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Analysis for: <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="
          font-medium
          bg-gradient-to-r from-blue-600 to-blue-400
          bg-clip-text text-transparent
          hover:from-blue-500 hover:to-blue-300
          transition-all duration-300
          relative
          group
        "
            >{url}<span className="
      absolute left-0 -bottom-0.5
      w-full h-0.5
      bg-gradient-to-r from-blue-400/70 to-blue-600/70
      transform origin-left scale-x-0 group-hover:scale-x-100
      transition-transform duration-300 ease-out
    " /></a></h1>
            <button
              id="get-pdf-button"
              className="
              bg-gradient-to-r from-blue-600 to-blue-400
              text-white
              font-medium
              px-4 py-2
              rounded-lg
              shadow-md
              hover:from-blue-500 hover:to-blue-300
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              ml-4
            "
              onClick={getPDF}
            >
              Download PDF
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LLM Evaluation Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">LLM Evaluation</h2>
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold mr-2 my-2 inline-block">
                    <span className={getScoreColor(llmEvaluation.ranking.score)}>
                      {llmEvaluation.ranking.score}/5
                    </span>
                  </span>
                  <span className="text-gray-700">Overall Score</span>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-gray-900">Evaluation Questions:</h3>
                <div className="space-y-4">
                  {llmEvaluation.ranking.questions.map((q, i) => (
                    <div key={i} className="border-l-6 border-blue-600 pl-3">
                      <p className="font-medium text-gray-900">{q.question}</p>
                      <div className="mt-2 text-sm">
                        <p className="text-gray-700">
                          <span className="font-semibold">Was your URL recommended by the AI when answering that question: </span>
                          {q.foundUrlMatch ? "Yes" : "No"}
                        </p>
                        {q.llmRecommendedUrls.length > 0 && (
                          <div className="mt-1">
                            <br></br>
                            <span className="font-semibold text-gray-900">Recommended URLs:</span>
                            <ul className="list-disc pl-5 mt-1">
                              {q.llmRecommendedUrls.map((url: string, idx: number) => (
                                <li key={idx} className="text-gray-800 text-sm break-all">{url}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Topical Relevance and Keyword Density */}
            <div className="space-y-6">
              {/* Topical Relevance */}
              {topicalRelevance && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Topical Relevance</h2>
                  <div>
                    <div className="flex items-baseline mb-3">
                      <span className={`text-4xl font-bold mr-2 ${getScoreColor(topicalRelevance.score)}`}>
                        {topicalRelevance.score}/10
                      </span>
                      <span className="text-gray-700">Relevance Score</span>
                    </div>
                    <div className="mt-3">
                      <p className="font-medium text-gray-900">Niche: <span className="font-normal text-gray-700">{topicalRelevance.niche}</span></p>
                      <br></br>
                      <h3 className="font-normal text-gray-700">Feedback message from AI:</h3>
                      <p className="mt-3 text-sm text-gray-700">{topicalRelevance.feedback}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Keyword Density */}
              {keywordDensity && keywordDensity.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Keyword Density</h2>
                  <div className="space-y-1">
                    {keywordDensity.slice(0, 5).map((kw, i) => (
                      <KeywordDensityDisplay
                        key={i}
                        keyword={kw.keyword}
                        densityAsPercent={kw.densityAsPercent}
                        count={kw.count}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Strengths and Weaknesses Analysis */}
          <StrengthsWeaknesses
            strengths={analysisResults.strengths}
            weaknesses={analysisResults.weaknesses}
          />
        </div>
      }
    </div>
  );
}