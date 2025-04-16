import * as cheerio from 'cheerio';

export async function GET(
    req: Request, 
    { params }: { params: Promise<{ url: string }>} 
) {
    try{
        const parameters = await params;
        const url = decodeURIComponent(parameters.url);
        const $ = await cheerio.fromURL(url);

        // get all json-ld script tags
        const scriptTags = $("script[type='application/ld+json']");
        const structuredData: unknown[] = [];

        // loop over all script tags (just 1 or maybe many) using Cheerio's .each()
        // element is the raw DOM element
        scriptTags.each((i, element) => {
            try {
                // $(element) turns it into a Cheerio object, which lets us use .text()
                // .text() gets JSON string in the script tag
                const jsonText = $(element).text();
                // parse the json string
                const parsedData = JSON.parse(jsonText);
                // add it to the array used to store results
                structuredData.push(parsedData);
            } catch (error){
                console.error('Error parsing json-ld', error)
            }
        });

        const extractedData = {
            title: $('title').text(),
            h1: $('h1').first().text(),
            metaDescription: $('meta[name="description"]').attr('content') || '',
            structuredData: structuredData.length > 0 ? structuredData : null
            // keywords... how do i decide what is a keyword or not?
        };
        return Response.json({ data: extractedData });
    } catch (error){
        console.error('Error loading document using URL', error);
        return Response.json({ 
            message: "Error loading document using URL", 
            error: JSON.stringify(error),
            status: 500
        });
    }
  }