interface LLMEvaluation {
    ranking: {
        score: number;
        questions: {
            question: string;
            foundUrlMatch: boolean;
            llmRecommendedUrls: string[];
        }[];
    };
}

interface scrapedInfo {
    bodyText: string,
    headers: [{ type: string, text: string }],
    keywordDensity: [keywordDensityObj],
    metaDescription: string,
    niche: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    structuredData: any[],
    title: string,
    topicalRelevance: topicalRelevance
}

interface keywordDensityObj {
    keyword: string,
    densityAsPercent: number,
    count: number
}

interface topicalRelevance {
    feedback: string,
    niche: string,
    score: number
}