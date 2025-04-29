"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
// import { Chart } from 'chart.js';

export default function Analysis() {
  const params = useParams();
  const [llmEvaluation, setLlmEvaluation] = useState(null);
  // this is what llm evaluatioon looks like
  // {
  //   url: "",
  //   niche: "",
  //   ranking: {
  //     score: null,
  //     questions: [{
  //       foundUrlMatch: null,
  //       llmRecommendedUrls: [],
  //       question: ""
  //     }]
  //   }
  // }

  // decode the URL that was inputted and passed from the form
  const decodedUrl = decodeURIComponent(params.url as string);

  useEffect(() => {
    async function scrapeAndAnalyze() {
      // get an object containing the scraped information of the site
      const formattedScrapingUrl = `/api/scrape/${encodeURIComponent(decodedUrl)}`;
      const response = await fetch(formattedScrapingUrl);
      const doc = await response.json();
      console.log('SCRAPED INFORMATION', doc.data);

      // remove structuredData and topicalRelevance since the llm-url-check does not need that info so no need to send it
      const scrapedInfoFormattedForLlmCheck = {
        ...doc.data,
        decodedUrl
      };
      delete scrapedInfoFormattedForLlmCheck.structuredData;
      delete scrapedInfoFormattedForLlmCheck.topicalRelevance;

      // make a request to the LLM-URL-checker to get an evaluation (returns an object)
      const scoring = await fetch('/api/llm-url-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapedInfoFormattedForLlmCheck)
      });
      const score = await scoring.json();
      console.log('LLM Evaluation using scraped info', score);
    }

    scrapeAndAnalyze();
  }, [decodedUrl]);

  return (
    <div>
      {llmEvaluation ? (
        <div>
          <h1>hello</h1>
        </div>
      ) : (
        <div>Loading...</div>
      )}

    </div>
  );
}