import * as cheerio from 'cheerio';
import { Element } from 'domhandler';

async function getAllHeaders($: cheerio.CheerioAPI): Promise<object[]> {
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

export {
    getAllHeaders,
    getStructuredData
};