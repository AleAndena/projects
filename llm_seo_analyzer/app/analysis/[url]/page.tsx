"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KeywordDensityDisplay } from '@/components/keyword-density-display';
import { LoadingAnalysis } from '@/components/loading-analysis';
import { StrengthsWeaknesses } from '@/components/strengths-weaknesses';
import { determineStrengthsAndWeaknesses } from './utils';
import { getPDF } from '@/app/utils/utils';
export default function Analysis() {
  const params = useParams();
  // interfaces/types are at the bottom of the page
  const [scrapedInfo, setScrapedInfo] = useState<scrapedInfo | null>(null);
  const [llmEvaluation, setLlmEvaluation] = useState<LLMEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{ strengths: strengthWeakness[], weaknesses: strengthWeakness[] }>({
    strengths: [],
    weaknesses: []
  });
  // decode the URL that was inputted and passed from the form
  const decodedUrl = decodeURIComponent(params.url as string);
  useEffect(() => {
    async function scrapeAndAnalyze() {
      try {
        setLoading(true);
        setShowCompletion(false);
        // get an object containing the scraped information of the site
        const formattedScrapingUrl = `/api/scrape/${encodeURIComponent(decodedUrl)}`;
        const response = await fetch(formattedScrapingUrl);
        const doc = await response.json();
        console.log('SCRAPED INFORMATION', doc.data);
        setScrapedInfo(doc.data);
        // remove structuredData and topicalRelevance since the llm-url-check does not need that info
        const scrapedInfoFormattedForLlmCheck = {
          ...doc.data,
          url: decodedUrl
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
    scrapeAndAnalyze();
  }, [decodedUrl]);
  // Helper function to render color based on score
  const getScoreColor = (score: number) => {
    if (score >= 2) return 'text-green-700';
    if (score >= 1) return 'text-yellow-700';
    return 'text-red-700';
  };
  if (loading) {
    return <LoadingAnalysis
      scrapedInfo={scrapedInfo}
      llmEvaluation={llmEvaluation}
      showCompletion={showCompletion}
    />
  }
  if (!llmEvaluation || !scrapedInfo) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded">
          <p>Error loading analysis. Please try again.</p>
        </div>
      </div>
    );
  }
  const topicalRelevance: topicalRelevance = scrapedInfo.topicalRelevance;
  const keywordDensity: [keywordDensityObj] = scrapedInfo.keywordDensity;
  return (
    <div id="analysis-page" className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analysis for: <a
          href={decodedUrl}
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
        >{decodedUrl}<span className="
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
  );
}