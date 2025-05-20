import { getDensityFeedback } from "@/app/utils/utils";

export function transformLLMEvaluation(llmEvaluation: LLMEvaluation) {
    const data = [];

    // Add the overall score row
    data.push({
        Section: "LLM Evaluation",
        Score: llmEvaluation.ranking.score,
        Question_Index: "",
        Question: "",
        Found_URL_Match: "",
        Recommended_URLs: ""
    });

    // Add each question as a row
    llmEvaluation.ranking.questions.forEach((q, index) => {
        data.push({
            Section: "LLM Evaluation",
            Score: "",
            Question_Index: String(index + 1),
            Question: q.question,
            Found_URL_Match: q.foundUrlMatch ? "TRUE" : "FALSE",
            Recommended_URLs: q.llmRecommendedUrls.join(",") || ""
        });
    });

    return data;
}

// Transform function for strengths and weaknesses
export function transformStrengthsWeaknesses(data: { strengths: strengthWeakness[], weaknesses: strengthWeakness[] }) {
    const result = [];

    // Handle Strengths
    if (data.strengths.length === 0) {
        result.push({ Type: "Strength", Name: "No strengths detected", Message: "" });
    } else {
        data.strengths.forEach(s => {
            result.push({
                Type: "Strength",
                Name: s.name,
                Message: s.message
            });
        });
    }

    // Handle Weaknesses
    if (data.weaknesses.length === 0) {
        result.push({ Type: "Weakness", Name: "No weaknesses detected", Message: "" });
    } else {
        data.weaknesses.forEach(w => {
            result.push({
                Type: "Weakness",
                Name: w.name,
                Message: w.message
            });
        });
    }

    return result;
}

// Transform function for keyword density
export function transformKeywordDensity(keywordDensity: keywordDensityObj[] | undefined) {
  const result = [];

  if (!keywordDensity || keywordDensity.length === 0) {
    result.push({ Keyword: "No keywords detected", "Density (%)": "", Count: "" });
  } else {
    keywordDensity.forEach(kw => {
      result.push({
        Keyword: kw.keyword,
        "Density (%)": kw.densityAsPercent,
        Count: kw.count,
        FeedbackAboutDensity: getDensityFeedback(kw.densityAsPercent)
      });
    });
  }

  return result;
}