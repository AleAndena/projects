import * as cheerio from 'cheerio';
import { Element } from 'domhandler';
import OpenAI from 'openai';

async function getAllHeaders($: cheerio.CheerioAPI): Promise<{type: string, text: string}[]> {
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
        headers: {type: string, text: string}[],
        metaDescription: string,
        bodyText: string,
        structuredData: object[]
    }
) {
    // extract all the values and assign them to variables
    const { title, metaDescription, headers } = mainPageInfo;

    // create the openai API using the key
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // format the headers for the AI
    const formattedHeaders = headers
        .filter(h => h.type === 'h1' || h.type === 'h2' || h.type === 'h3')
        .map(h => h.text)
        .join(',')
        || '';

    // create the prompt for the API
    const prompt = `Title: ${title || 'Untitled'}\nMeta: ${metaDescription || 'No description'}\n\nH1-H2-H3: ${formattedHeaders || 'No H1-H2-H3'}`;
    console.log(prompt);

    // create the prompt using the information provided
    try {
        const result = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: "You're an SEO expert. Given a site's title, meta description, and H1, suggest 5 keywords seperated by commas for its niche.",
                },
                {
                    role: 'user',
                    content: `${prompt}`,
                },
            ],
            max_tokens: 50,
        });

        //extract the keywords from the output of AI and return it
        const keywordsFromAi = result.choices[0].message.content;
        return keywordsFromAi !== null ? keywordsFromAi.split(',').map(keyword => keyword.trim().toLowerCase()) : [];
    } catch (error) {
        console.error('OpenAI error:', error);
    }
}

export {
    getAllHeaders,
    getStructuredData,
    getKeywords
};