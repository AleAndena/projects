import * as cheerio from 'cheerio';
import { getStructuredData, getAllHeaders, getKeywords } from '@/app/utils/utils';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ url: string }> }
) {
    try {
        // initialize arrays
        const arrOfCheerioAPIs = []; // gonna have the cheerioAPI and the url (for identification purposes)
        const arrOfOtherLinks: string[] = []; // stores other urls to scrape as well

        // get content for the main/home page using given URL
        // put it into the API array
        const parameters = await params;
        const url = decodeURIComponent(parameters.url);
        const $ = await cheerio.fromURL(url);
        arrOfCheerioAPIs.push($);

        // check if there are any other key pages that we should also scrape
        // if so, get the URL for them too
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            if (href && href.includes('about')) {
                const fullURL = new URL(href, url).href;
                // no duplicate links
                if(!arrOfOtherLinks.includes(fullURL)){
                    arrOfOtherLinks.push(fullURL)
                }
            }
        });

        // loop over all the other links and do fromURL on each of them to get their content
        const otherPagesPromises = arrOfOtherLinks.map(async link => {
            return await cheerio.fromURL(link);
        });
        // process them in parallel
        const otherPagesCheerioAPIs = await Promise.all(otherPagesPromises);

        // then add them to arrOfCheerioAPIs so that it now has all the CheerioAPIs
        arrOfCheerioAPIs.push(...otherPagesCheerioAPIs);

        // Now, loop over each of them and get each of their information, and store it in
        // an array of objects, where each object is a seperate page and its info
        const pageDataPromises = arrOfCheerioAPIs.map(async ($) => {
            const bodyText = getCleanText($);

            const placeholderObj = {
                title: $('title').text(),
                headers: await getAllHeaders($),
                metaDescription: $('meta[name="description"]').attr('content') || '',
                bodyText: bodyText,
                structuredData: await getStructuredData($, $("script[type='application/ld+json']")),
            };
            const keywords = await getKeywords(placeholderObj);
            console.log('KEYWORDS FROM AI', keywords);

            return placeholderObj;
        });

        // again, process them all together
        const allPagesData = await Promise.all(pageDataPromises);

        // return that array of objects where each object is a page and its info
        return Response.json({ data: allPagesData });
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