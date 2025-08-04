import * as cheerio from 'cheerio';
import { Element } from 'domhandler';
import { formatHeadersForAI, promptToAi } from '@/app/utils/utils';

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

async function getKeywords(
    mainPageInfo: {
        title: string,
        headers: { type: string, text: string }[],
        metaDescription: string,
        bodyText: string,
        structuredData: object[]
    }
): Promise<string[]> {
    try {
        // extract all the values and assign them to variables
        const { title, metaDescription, headers } = mainPageInfo;

        // format the headers for the AI
        const formattedHeaders = formatHeadersForAI(headers);

        // create the prompt for the API
        const userContent = `Title: ${title || 'Untitled'}\nMeta: ${metaDescription || 'No description'}\n\nH1-H2-H3: ${formattedHeaders || 'No H1-H2-H3'}`;
        const systemContent = "You're an SEO expert. Given a site's title, meta description, and H1, suggest 5 keywords seperated by commas for its niche. Make sure that there are NO company names, and that they are SINGLE WORD keywords, not phrases.";

        const extractedApiResult = await promptToAi(systemContent, userContent, 50, false)
        return extractedApiResult !== null ? extractedApiResult.split(',').map(keyword => keyword.trim().toLowerCase()) : [];
    } catch (error) {
        console.error('OpenAI error:', error);
        return [];
    }
}

async function getKeywordDensity(keywords: string[], bodyText: string) {
    if (!bodyText || !keywords || keywords.length === 0) return [];

    // get total num of words
    const words = bodyText.toLowerCase().split(/\s+/).filter((word) => word.length > 0);
    const totalWords = words.length;

    // map through each keyword and get their density and count
    return keywords.map((keyword) => {
        // num of occurrences of the keyword in the text
        const count = words.filter((word) => word === keyword.toLowerCase()).length;
        // calcualte keyword density as PERCENTAGES, typical answers will be like 0.5%-2%
        const density = Math.min((count / totalWords) * 100, 100);

        return { keyword, densityAsPercent: Number(density.toFixed(2)), count };
    });
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
    // format the site info for the AI to go through to determine topical relevance
    const formattedSiteInfo = `Title: ${title || 'Untitled'}\nMeta: ${metaDescription || 'No description'}\nHeaders: ${formattedHeaders} || 'No headers'`;

    try {
        // create the prompt with the information to go through to check the relevance of the site
        const userContent = `Site info: ${formattedSiteInfo}\nBody (first 500 chars): ${bodyText.slice(0, 500) || 'No body text'}\n\nIs this page about "${niche}"? Evaluate based on these CRITERIA:
        1. Keyword alignment (0-3 points) 2. Content depth about niche (0-3 points) 3. Audience targeting match (0-2 points) 4. Commercial intent alignment (0-2 points). The SCORE value being returned is the combination of those 4 scores that you evaluated and FEEDBACK briefly discusses the scores you gave. Return JSON: { score: number, feedback: string }`;
        const systemContent = `You’re an SEO expert. Given a page’s title, meta description, headers, and a sample of body text, assess if it’s about a specific niche. Use this as a scoring guide to decide a final score: 
        - Keyword Alignment (0-3):
          0: No niche keywords
          1: Some keywords present
          2: Good keyword coverage
          3: Perfect keyword integration
        - Content Depth (0-3):
          0: No real content about niche
          1: Briefly mentions niche
          2: Covers multiple aspects
          3: Comprehensive niche coverage
        - Audience Match (0-2):
          0: Wrong audience
          1: Partial audience match
          2: Perfect audience targeting
        - Commercial Intent (0-2):
          0: No commercial alignment
          1: Somewhat aligned
          2: Perfect commercial fit. 
          The SCORE that is returned is the combination of the previous scores you evaluated. 
          The FEEDBACK briefly discusses the scores you gave and why.
          Return ONLY raw JSON without any markdown formatting or additional text, like this: {score: number, feedback: string}`;

        // now prompt the AI for a score of the relevance of the site and for a rating
        const extractedApiResult = await promptToAi(systemContent, userContent, 300, true);
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

export {
    getStructuredData,
    getAllHeaders,
    getKeywords,
    getKeywordDensity,
    getTopicalRelevance,
    getNicheOfSite
};