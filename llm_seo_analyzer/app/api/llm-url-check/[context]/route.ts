import { formatHeadersForAI, promptToAi } from '@/app/utils/utils';

export async function GET(
    req: Request,
    { params }: {
        params: Promise<{
            context: string // string that needs to be parsed with website information
        }>
    }
) {
    try {
        // extract parameters that were passed in
        const parameters = await params;
        const context = JSON.parse(decodeURIComponent(parameters.context));
        const { url, title, headers, metaDescription, bodyText, niche } = context;


        // format info for the AI
        const formattedHeaders = formatHeadersForAI(headers);
        // const formattedBodyText = bodyText.slice(0, 500);

        //context for the questions prompt so that the questions can be more accurate (MAYBE I CAN TRY WITHOUT THIS AND SEE IF THE QUESTIONS ARE STILL GOOD)
        const contextAboutSiteForAI = `Headers: ${formattedHeaders}, meta description: ${metaDescription}, title: ${title}`;
        
        // < -- FOURTH PROMPT TO AI -->
        // Generate the questions that will be used to see 
        // if the inputted URL shows up in the AI's response
        const questionUserContent = `Given this category/niche: "${niche}", generate 5 questions about the best tools or solutions in that category (e.g., What’s the best [niche]?). Use this context to make questions specific: ${contextAboutSiteForAI}. Return only RAW JSON like this: { questions: string[] }`;
        const questionSystemContent = 'You’re an SEO expert. Generate specific questions about the best tools/solutions for a category, using provided context. Return JSON.';
        const questionExtractedApiResult = await promptToAi(questionSystemContent, questionUserContent, 200, true);        
        const questions = questionExtractedApiResult !== null ? JSON.parse(questionExtractedApiResult) : 'No questions returned from OpenAI API...';
        console.log("QUESTIONS AFTER BEING EXTRACTED", questions);
        
        // <-- FIFTH PROMPT TO AI -->
        const answersUserContent = `Answer these questions about "${niche}":\n${questions.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\nFor each, list top 3 tools/sites (URLs). Use this context: ${contextAboutSiteForAI}\nReturn RAW JSON with no markdown that looks exactly like this: [{ question: string, URLs: string [] }]`;
        const answersSystemContent = 'You’re an SEO expert. Answer questions about a category, listing URLs to the top 3 tools/sites. Use provided context and body text. Return JSON.';
        const answersExtractedApiResult = await promptToAi(answersSystemContent, answersUserContent, 1000, false);
        const answers = answersExtractedApiResult !== null ? JSON.parse(answersExtractedApiResult) : [];
        console.log("ANSWERS after being EXTRACTED", answers);

        // find matches of the initial URL in the answers returned from the API
        // `answers` VISUALIZATION: answers is an array of objects, where each object has a question and list of URLs (strings)
            const matches = answers
            .map((API_answer: { question: string, URLs: string[] }) => {
                // above line specifies what an API_answer looks like
                // it has string question (question being answered), and results is an array of url strings
                return {
                    question: API_answer.question,
                    foundUrlMatch: API_answer.URLs.some(urlFromAi => urlFromAi.includes(url)) 
                }
            });
        console.log("MATCHES", matches);
        
        // calculate how good the site is in terms of how much it shows up in AI responses
        const score = Math.round((matches.length / questions.length) * 100);
        console.log("SCOREEEEE", score);

        // return the derived niche, questions asked, and the score and matches 
        return Response.json({niche, ranking: { score, questions: matches }});
    } catch (error) {
        console.error('Error doing LLM URL scan: ', error);
    }
}
