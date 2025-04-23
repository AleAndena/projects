import OpenAI from 'openai';
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
        // small-ish prompt & kinda big response (200 tokens max)
        // Generate the questions that will be used to see 
        // if the inputted URL shows up in the AI's response
        const questionUserContent = `Given this category/niche: "${niche}", generate 10 questions about the best tools or solutions in that category (e.g., What’s the best [niche]?). Use this context to make questions specific: ${contextAboutSiteForAI}. Return only RAW JSON like this: { questions: string[] }`;
        const questionSystemContent = 'You’re an SEO expert. Generate specific questions about the best tools/solutions for a category, using provided context. Return JSON.';

        const questionExtractedApiResult = await promptToAi(questionSystemContent, questionUserContent, 200, true);        
        const questions = questionExtractedApiResult !== null ? JSON.parse(questionExtractedApiResult) : 'No questions returned from OpenAI API...';
        
        // <-- FIFTH PROMPT TO AI -->
        // big prompt & a very big response
        // Now ask the API all ten questions and store the
        // answers so that later we can compare the URL to the answers
        // got rid of this because I think its just too long so not necessary --> Body (first 500 chars): ${formattedBodyText || 'No body text'}\n 
        const answersUserContent = `Answer these questions about "${niche}":\n${questions.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\nFor each, list top 3 tools/sites (name, URL). Use this context: ${contextAboutSiteForAI}\nReturn RAW JSON with no markdown: { answers: { question: string, results: { name: string, url: string }[] }[] }`;
        const answersSystemContent = 'You’re an SEO expert. Answer questions about a category, listing top 3 tools/sites with names and URLs. Use provided context and body text. Return JSON.';

        const answersExtractedApiResult = await promptToAi(answersSystemContent, answersUserContent, 1000, true);
        console.log('EXTRACTED ASNWERS FROM API', answersExtractedApiResult);
        const answers = answersExtractedApiResult !== null ? JSON.parse(answersExtractedApiResult) : 'No answers returned from OpenAI API...';

        // find matches of the initial URL in the answers returned from the API
        // `answers` VISUALIZATION: answers is an array of objects, and each of those object 
        // has a string question and an array of objects where each object has a string name and a string url
        const matches = answers.answers
            .map((API_answer: { question: string, results: { name: string, url: string }[] }) => {
                // above line specifies what an API_answer looks like
                // it has string question (question being answered), and results is an array of obj with name and url
                return {
                    question: API_answer.question,
                    answer: API_answer.results.find(result =>result.url.includes(url))?.name || '' 
                }
            });

        // calculate how good the site is in terms of how much it shows up in AI responses
        const score = Math.round((matches.length / questions.length) * 100);

        // return the derived niche, questions asked, and the score and matches 
        return Response.json({niche,questions,ranking: { score, matches }});
    } catch (error) {
        console.error('Error doing LLM URL scan: ', error);
    }
}

// draft of idea
// given to the route:
//   - the url
//   - headers
//   - structured data? if available
//   - title
//   - meta description
//   - maybe some body text if necessary

// then ask the API to come up with the category based off the context

// then ask the the API to come up with like 10-15 questions to ask
// to the API again about the best tool

// then finally ask the API those questions that got generated
// and see if the initial URL shows up in those generated answers
