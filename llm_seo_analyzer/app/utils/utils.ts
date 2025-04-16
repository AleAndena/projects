import * as cheerio from 'cheerio';
import { Element } from 'domhandler';

async function getStructuredData(
    $: cheerio.CheerioAPI, 
    scriptTags: cheerio.Cheerio<Element>
): Promise<unknown[]> {
    // loop over all script tags (just 1 or maybe many) using Cheerio's .each()
    // element is the raw DOM element
    const structuredData: unknown[] = [];
    
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

export {
    getStructuredData
};