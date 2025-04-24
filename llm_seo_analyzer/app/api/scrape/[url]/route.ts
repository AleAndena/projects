import * as cheerio from 'cheerio';
import { getStructuredData, getAllHeaders, getKeywords, getTopicalRelevance, getNicheOfSite, getKeywordDensity } from './utils';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ url: string }> }
) {
    try {
        // get content for the main/home page using given URL
        const parameters = await params;
        const url = decodeURIComponent(parameters.url);
        const $ = await cheerio.fromURL(url);

        // extract main page data
        const title = $('title').text();
        const headers = await getAllHeaders($);
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        const bodyText = getCleanText($);
        const structuredData = await getStructuredData($, $("script[type='application/ld+json']"));
        
        // <-- FIRST PROMPT TO AI -->
        const niche = await getNicheOfSite(title, headers, metaDescription);

        const pageData = {
            title,
            headers,
            metaDescription,
            bodyText,
            structuredData,
            niche,
            // <-- SECOND PROMPT TO AI -->
            topicalRelevance: await getTopicalRelevance({
                title, headers, metaDescription, bodyText, structuredData, niche
            }),
            keywordDensity: {}
        };
        
        // <-- THIRD PROMPT TO AI -->
        const keywords = await getKeywords(pageData);
        console.log('KEYWORDS FROM AI', keywords);
        const keywordDensity = await getKeywordDensity(keywords, bodyText);
        console.log("keyword Density", keywordDensity);
        
        // add keyword density to the pageData object
        pageData.keywordDensity = keywordDensity;

        // pass everything back to the client
        return Response.json({ data: pageData });
    } catch (error) {
        console.error('Error loading document using URL', error);
        return Response.json({
            message: "Error loading document using URL",
            error: JSON.stringify(error),
            status: 500
        });
    }
}

// Helper function for getting body text without unwanted garbage
function getCleanText($: cheerio.CheerioAPI) {
    const $clone = $('body').clone();
    $clone.find('script, style, noscript, code, pre').remove();
    return $clone.text()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .slice(0, 8000);
}