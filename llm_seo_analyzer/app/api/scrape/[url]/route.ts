import * as cheerio from 'cheerio';
import { getStructuredData, getAllHeaders } from '@/app/utils/utils';

export async function GET(
    req: Request, 
    { params }: { params: Promise<{ url: string }>} 
) {
    try{
        const parameters = await params;
        const url = decodeURIComponent(parameters.url);
        const $ = await cheerio.fromURL(url);

        // get all headers
        const arrOfHeaders = await getAllHeaders($);
        console.log('TEsting thing to visualize', $('h1, h2, h3'));

        // get all json-ld script tags
        const scriptTags = $("script[type='application/ld+json']");
        const structuredData: unknown[] = await getStructuredData($, scriptTags);

        const extractedData = {
            title: $('title').text(),
            headers: arrOfHeaders,
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