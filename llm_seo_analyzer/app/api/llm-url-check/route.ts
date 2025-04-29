import { formatHeadersForAI, promptToAi } from '@/app/utils/utils';

export async function POST(req: Request) {
    try {
        // extract parameters that were passed in
        const context = await req.json();
        const { url, title, headers, metaDescription, niche } = context;

        // format info for the AI
        const formattedHeaders = formatHeadersForAI(headers);

        //context for the questions prompt so that the questions can be more accurate (MAYBE I CAN TRY WITHOUT THIS AND SEE IF THE QUESTIONS ARE STILL GOOD)
        const contextAboutSiteForAI = `Headers: ${formattedHeaders}, meta description: ${metaDescription}, title: ${title}`;

        // < -- FOURTH PROMPT TO AI -->
        // Generate questions that about the niche so that we can see if the URL shows up as a recomended tool or not
        const questionUserContent = `Given this category/niche: "${niche}", generate 5 generic questions asking about what the best TOOLS or SERVICES for that category are. To refine the niche, use this context but exclude brand-specific terms: ${contextAboutSiteForAI}. Return only RAW JSON without ANY markdown like this: string[]`;
        const questionSystemContent = 'You’re an SEO expert. Generate 5 specific questions about the best TOOLS or SERVICES for a given category/niche. Questions must focus on the niche (e.g., What is the best [tool/service] for [specific niche application]) and MUST NOT mention any specific brand, company, or URL. Focus on concrete, purchasable tools/services (e.g., "best CRM software" not "best practices"). Use the provided context to understand the niche but exclude brand-specific terms. Return RAW JSON without ANY markdown in this format: string[]';
        const questionExtractedApiResult = await promptToAi(questionSystemContent, questionUserContent, 200, false);
        const questions = questionExtractedApiResult !== null ? JSON.parse(questionExtractedApiResult) : 'No questions returned from OpenAI API...';

        // <-- FIFTH PROMPT TO AI -->
        // Ask the AI the questions generated above and extract it's answers
        const answersUserContent = `Answer these questions about "${niche}":\n${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\nFor each, list top 3 tools/sites (URLs). \nReturn RAW JSON with no markdown that looks exactly like this: [{ question: string, URLs: string [] }]`;
        const answersSystemContent = 'You’re an SEO expert. Answer questions about a category, listing URLs to the top 3 tools/sites. Use provided context and body text. Return JSON.';
        const answersExtractedApiResult = await promptToAi(answersSystemContent, answersUserContent, 1000, false);
        const answers = answersExtractedApiResult !== null ? JSON.parse(answersExtractedApiResult) : [];

        // find matches of the initial URL in the answers returned from the API
        // For reference --> answers is an array of objects, where each object has a question and array of URLs (strings)
        const questionsAndIsMatch = answers
            .map((API_answer: { question: string, URLs: string[] }) => {
                try {
                    // convert initial URL and AI API url so they can be compared properly
                    const inputUrlObj = new URL(url);
                    const hasMatch = API_answer.URLs.some(urlFromAi => {
                        try {
                            const aiUrlObj = new URL(urlFromAi);
                            return aiUrlObj.hostname.replace('www.', '') ===
                                inputUrlObj.hostname.replace('www.', '');
                        } catch {
                            return false;
                        }
                    });

                    return {
                        question: API_answer.question,
                        foundUrlMatch: hasMatch,
                        llmRecommendedUrls: API_answer.URLs
                    };
                } catch {
                    return {
                        question: API_answer.question,
                        foundUrlMatch: false
                    };
                }
            });
        
        // calculate how good the site is in terms of how much it shows up in AI responses
        const numOfMatches = questionsAndIsMatch.filter((questionAndIsMatch: { question: string, foundUrlMatch: boolean; }) => questionAndIsMatch.foundUrlMatch === true).length;
        const score = Math.round((numOfMatches / questions.length) * 100);

        // return the derived niche, questions asked, and the score and matches 
        return Response.json({ niche, ranking: { score, questions: questionsAndIsMatch } });
    } catch (error) {
        console.error('Error doing LLM URL scan: ', error);
    }
}
