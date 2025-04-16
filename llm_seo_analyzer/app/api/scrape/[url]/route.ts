import * as cheerio from 'cheerio';
import { getStructuredData, getAllHeaders } from '@/app/utils/utils';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ url: string }> }
) {
    try {
        // initialize arrays
        const arrOfCheerioAPIs: cheerio.CheerioAPI[] = [];
        const arrOfOtherLinks: string[] = [];

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
                arrOfOtherLinks.push(href);
            }
        });

        // loop over all the other links and do fromURL on each of them to get their content
        const otherPagesPromises = arrOfOtherLinks.map(link => {
            return cheerio.fromURL(link);
        });
        // process them in parallel
        const otherPagesCheerioAPIs = await Promise.all(otherPagesPromises);

        // then add them to arrOfCheerioAPIs so that it now has all the CheerioAPIs
        arrOfCheerioAPIs.push(...otherPagesCheerioAPIs);

        // Now, loop over each of them and get each of their information, and store it in
        // an array of objects, where each object is a seperate page and its info
        const pageDataPromises = arrOfCheerioAPIs.map(async ($) => {
            const placeholderObj = {
                title: $('title').text(),
                headers: await getAllHeaders($),
                metaDescription: $('meta[name="description"]').attr('content') || '',
                structuredData: await getStructuredData($, $("script[type='application/ld+json']")),
                // keywords... how do i decide what is a keyword or not?
            };

            // the [] is not an array, it is there cuz the key name is dynamic so you need to put it
            return { [`${$.name}`]: placeholderObj }
        });

        const allPagesData = await Promise.all(pageDataPromises);

        return Response.json({ data: allPagesData });

        // // initialize the array of objects
        // const extractedData = [{
        //     title: $('title').text(),
        //     headers: [{}],
        //     metaDescription: $('meta[name="description"]').attr('content') || '',
        //     structuredData: [{}],
        //     // keywords... how do i decide what is a keyword or not?
        // }];

        // // get all headers
        // const arrOfHeaders = await getAllHeaders($);
        // extractedData[0].headers = arrOfHeaders;

        // // get all json-ld script tags
        // const scriptTags = $("script[type='application/ld+json']");
        // const structuredData: object[] = await getStructuredData($, scriptTags);
        // extractedData[0].structuredData = structuredData;

        // then i need to do fromUrl for that URL too.

        // AND THEN i need to do the same extraction shit for that page too.

        // AND THENNNN i need to add that page to the final extractedData object, but lowkey
        // do make the parent an array and have the objects inside, so its an array of the pages extracted data stored
        // as objects.
    } catch (error) {
        console.error('Error loading document using URL', error);
        return Response.json({
            message: "Error loading document using URL",
            error: JSON.stringify(error),
            status: 500
        });
    }
}