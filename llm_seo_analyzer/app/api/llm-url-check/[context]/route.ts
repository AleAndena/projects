import OpenAI from 'openai';

export async function GET(
    req: Request,
    { params }: {
        params: Promise<{
            context: string // string that needs to be parsed
        }>
    }
) {
    try {
        const parameters = await params;
        const context = JSON.parse(decodeURIComponent(parameters.context));
        const { url, title, headers, metaDescription, bodyText } = context;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

        // format the headers for the AI
        const formattedHeaders = headers
            .filter(h => h.type === 'h1' || h.type === 'h2' || h.type === 'h3')
            .map(h => h.text)
            .join(',')
            || '';
        // format body text to not be too long
        const formattedBodyText = bodyText.slice(0, 500);

        // ask API for the category of the site to be used later based off context input
        // WILL VERY LIKELY BE OPTIMIZED LATER TO NOT HAVE TO BE DONE TWICE
        // since it is done in utils.ts in getTopicalRelevance, and now here as well
        const nichePrompt = `Title: ${title || 'Untitled'}\nMeta description: ${metaDescription || 'No meta description'}\nHeaders: ${formattedHeaders} || 'No headers'`;
        const nicheResult = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You’re an SEO expert. Based on a page’s title, meta description, and headers, what is its niche? Return a short phrase (ex: supermarket equipment).',
                },
                { role: 'user', content: nichePrompt },
            ],
            max_tokens: 10,
            temperature: 0.5,
        });

        // get the niche/category from the API
        const extractedNicheResult = nicheResult.choices[0].message.content;
        const niche = extractedNicheResult !== null ? extractedNicheResult.trim() : 'No niche returned from OpenAI API...';

        // Generate the questions that will be used to see 
        // if the inputted URL shows up in the AI's response
        const questionsPrompt = `Given this category/niche: "${niche}", generate 10 questions about the best tools or solutions in that category (e.g., What’s the best [niche]?). Use this context to make questions specific: ${nichePrompt}. Return only RAW JSON like this: { questions: string[] }`;
        // do i manually add a thing asking the AI to provide links to these tools/solutions before I actually ask the AI?
        const questionsResult = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You’re an SEO expert. Generate specific questions about the best tools/solutions for a category, using provided context. Return JSON.',
                },
                { role: 'user', content: questionsPrompt },
            ],
            response_format: { type: "json_object" },
            max_tokens: 200,
            temperature: 0.5
        });
        const extractedQuestionsResult = questionsResult.choices[0].message.content;
        const questions = extractedQuestionsResult !== null ? JSON.parse(extractedQuestionsResult) : 'No questions returned from OpenAI API...';
        // Now ask the API all ten questions and store the
        // answers so that later we can compare the URL to the answers
        const answersPrompt = `Answer these questions about "${niche}":\n${questions.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\nFor each, list top 3 tools/sites (name, URL). Use this context: ${nichePrompt}\nBody (first 500 chars): ${formattedBodyText || 'No body text'}\nReturn RAW JSON with no markdown: { answers: { question: string, results: { name: string, url: string }[] }[] }`;
        const answersResult = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You’re an SEO expert. Answer questions about a category, listing top 3 tools/sites with names and URLs. Use provided context and body text. Return JSON.',
                },
                { role: 'user', content: answersPrompt },
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000,
            temperature: 0.5,
        });
        const extractedAnswersResult = answersResult.choices[0].message.content;
        console.log('EXTRACTED ASNWERS FROM API', extractedAnswersResult);
        const answers = extractedAnswersResult !== null ? JSON.parse(extractedAnswersResult) : 'No answers returned from OpenAI API...';

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
