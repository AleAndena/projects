"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
// import { Chart } from 'chart.js';

export default function Analysis() {
  const params = useParams();
  const [data, setData] = useState({
    url: "",
    niche: "",
    ranking: {
      score: null,
      questions: [{
        foundUrlMatch: null,
        llmRecommendedUrls: [],
        question: ""
      }]
    }
  });

  useEffect(() => {
    // Parse data from URL query params
    if (params.data) {
      try {
        const decodeData = decodeURIComponent(params.data as string);
        setData(JSON.parse(decodeData))
      } catch (error) {
        console.error("Failed to parse LLM evaluation: ", error);
      }
    }
  }, [params.data]);

  if (!data) return

  return (
    <div>
      {data ? (
        <div>
          <h1>Analysis for {data.url}</h1>
          {data.ranking.questions.length > 0 && data.ranking.questions.map((question) => {
            return <li className="bg-gray-800 text-white-500" key={question.question}>Match: {String(question.foundUrlMatch)}</li>
          }
          )}
        </div>
      ) : (
        <div>Loading...</div>
      )}

    </div>
  );
}