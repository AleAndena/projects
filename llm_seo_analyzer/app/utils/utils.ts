import * as cheerio from 'cheerio';
import { Element } from 'domhandler';
import OpenAI from 'openai';

async function getAllHeaders($: cheerio.CheerioAPI): Promise<{ type: string, text: string }[]> {
    // loop over all of those headers and get just their name and text
    return $('h1, h2, h3').map((i, element) => {
        return {
            // type is like h1, h2 or h3
            type: element.name,
            // text is simply what is actually written
            text: $(element).text()
        }
    }).toArray();
}

async function getStructuredData(
    $: cheerio.CheerioAPI,
    scriptTags: cheerio.Cheerio<Element>
): Promise<object[]> {
    // loop over all script tags (just 1 or maybe many) using Cheerio's .each()
    // element is the raw DOM element
    const structuredData: object[] = [];

    scriptTags.each((i: number, element: Element) => {
        try {
            // $(element) turns it into a Cheerio object, which lets us use .text()
            // .text() gets JSON string in the script tag
            const jsonText = $(element).text();
            // parse the json string
            const parsedData = JSON.parse(jsonText);
            // add it to the array used to store results
            structuredData.push(parsedData);
        } catch (error) {
            console.error('Error parsing json-ld', error)
        }
    });

    return structuredData;
}

// Decided not to use key page info alongside main page info because then
// there would be so much context and it could be very expensive/inefficient and maybe even inaccurate.
// Key page information will be used for keyword density calculation, not for giving context to the AI to 
// decide on keywords to check for
async function getKeywords(
    mainPageInfo: {
        title: string,
        headers: { type: string, text: string }[],
        metaDescription: string,
        bodyText: string,
        structuredData: object[]
    }
) {
    try {
        // extract all the values and assign them to variables
        const { title, metaDescription, headers } = mainPageInfo;

        // format the headers for the AI
        const formattedHeaders = formatHeadersForAI(headers);

        // create the prompt for the API
        const userContent = `Title: ${title || 'Untitled'}\nMeta: ${metaDescription || 'No description'}\n\nH1-H2-H3: ${formattedHeaders || 'No H1-H2-H3'}`;
        const systemContent = "You're an SEO expert. Given a site's title, meta description, and H1, suggest 5 keywords seperated by commas for its niche.";

        const extractedApiResult = await promptToAi(systemContent, userContent, 50, false)
        return extractedApiResult !== null ? extractedApiResult.split(',').map(keyword => keyword.trim().toLowerCase()) : [];
    } catch (error) {
        console.error('OpenAI error:', error);
    }
}

async function getTopicalRelevance(
    // define what pageInfo looks like (for typescript)
    pageInfo:
        {
            title: string,
            headers: { type: string, text: string }[],
            metaDescription: string,
            bodyText: string,
            structuredData: object[],
            niche: string
        }) {
    const { title, metaDescription, headers, bodyText, niche } = pageInfo;

    // format the headers for the AI
    const formattedHeaders = formatHeadersForAI(headers);

    // create the prompt asking AI about the niche of the site without using the body text
    // this allows the prompt to be dynamic since URLs being given can be super different in terms of actual content
    const formattedSiteInfo = `Title: ${title || 'Untitled'}\nMeta: ${metaDescription || 'No description'}\nHeaders: ${formattedHeaders} || 'No headers'`;

    try {
        // create the prompt with the information to go through to check the relevance of the site
        const userContent = `Site info: ${formattedSiteInfo}\nBody (first 500 chars): ${bodyText.slice(0, 500) || 'No body text'}\n\nIs this page about "${niche}"? Rate its relevance from 0–10 (0=unrelated, 10=perfectly aligned). Return JSON: { score: number, feedback: string }`;
        const systemContent = 'You’re an SEO expert. Given a page’s title, meta description, headers, and a sample of body text, assess if it’s about a specific niche. Rate relevance from 0–10 (0=unrelated, 10=perfectly aligned). Return ONLY raw JSON without any markdown formatting or additional text, like this: {"score": number, "feedback": string}`.';

        // now prompt the AI for a score of the relevance of the site and for a rating
        const extractedApiResult = await promptToAi(systemContent, userContent, 100, true);
        const relevance = extractedApiResult !== null ? JSON.parse(extractedApiResult) : '';

        // return obj with niche, score and feedback
        return { niche, score: relevance.score, feedback: relevance.feedback };
    } catch (error) {
        console.error(error);
        return { niche: 'Could not find a niche', score: 0, feedback: 'Error getting relevance.' };
    }
}

async function getNicheOfSite(
    title: string,
    headers: { type: string, text: string }[],
    metaDescription: string
): Promise<string> {
    try {
        // format the headers for the AI
        const formattedHeaders = formatHeadersForAI(headers);

        // create the prompt asking AI about the niche of the site without using the body text
        // this allows the prompt to be dynamic since URLs being given can be super different in terms of actual content
        const userContent = `Title: ${title || 'Untitled'}\nMeta: ${metaDescription || 'No description'}\nHeaders: ${formattedHeaders} || 'No headers'`;
        const systemContent = 'You’re an SEO expert. Based on a page’s title, meta description, and headers, what is its niche? Return a short phrase (ex: supermarket equipment).';

        const extractedApiResult = await promptToAi(systemContent, userContent, 10, false);
        return extractedApiResult !== null ? extractedApiResult.trim() : '';
    } catch (error) {
        console.error("Error getting niche from site", error);
        return "Error while getting niche of site";
    }
}

function formatHeadersForAI(headers: { type: string; text: string; }[]) {
    return headers
        .filter(h => h.type === 'h1' || h.type === 'h2' || h.type === 'h3')
        .map(h => h.text)
        .join(',')
        || '';
}

async function promptToAi(systemContent: string, userContent: string, maxTokens: number, isJson: boolean) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

    // create the settings for the prompt and give it the parameters given to the function
    const apiConfig: any = {
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: systemContent,
            },
            { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        // line below may cause a problem
        temperature: 0.5,
    };
    if (isJson) {
        apiConfig.response_format = { type: "json_object" };
    }

    // now ask the API the prompt and wait for an answer
    const apiResult = await openai.chat.completions.create(apiConfig);

    // extract the answer from the API's response
    return apiResult.choices[0].message.content;
    // if(isJson){
    //     return extractedApiResult !== null ? JSON.parse(extractedApiResult) : '';
    // } else {
    //     return extractedApiResult !== null ? extractedApiResult.trim() : '';
    // }
}

export {
    getAllHeaders,
    getStructuredData,
    getKeywords,
    getTopicalRelevance,
    getNicheOfSite,
    formatHeadersForAI,
    promptToAi
};