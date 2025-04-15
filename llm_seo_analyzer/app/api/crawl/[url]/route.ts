import * as cheerio from 'cheerio';

export async function GET(
    req: Request, 
    { params }: { params: Promise<{ url: string }>} 
) {
    try{
        const parameters = await params;
        const url = decodeURIComponent(parameters.url);

        const $ = await cheerio.fromURL(url);
        return Response.json({ "html": $.html() });
    } catch (error){
        console.error('Error loading document using URL', error);
        return {error: error};
    }
  }