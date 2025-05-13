import OpenAI from 'openai';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { Dispatch, SetStateAction } from 'react';

function formatHeadersForAI(headers: { type: string; text: string; }[]) {
    return headers
        .filter(h => h.type === 'h1' || h.type === 'h2' || h.type === 'h3')
        .map(h => h.text)
        .join(',')
        || '';
}

async function promptToAi(systemContent: string, userContent: string, maxTokens: number, isJson: boolean) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

    const apiResult = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: systemContent,
            },
            { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        response_format: isJson ? { type: "json_object" } : undefined,
        temperature: 0.5,
    });

    // extract the answer from the API's response
    return apiResult.choices[0].message.content;
}

// Source of logic for making the PDF:
// https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/
function getPDF() {
    try {
        const domElement = document.getElementById('analysis-page');
        const pdfButton = document.getElementById('get-pdf-button');

        if (!pdfButton || !domElement) {
            throw new Error("Could not find `analysis-page` or `get-pdf-button` element");
        }

        html2canvas(domElement, {
            onclone: () => {
                pdfButton.style.visibility = 'hidden';
            }
        })
            .then((canvas) => {
                // convert content to a PNG
                const imgData = canvas.toDataURL('image/png');

                // get dimensions of the canvas (the captured area)
                const imgWidthPx = canvas.width;
                const imgHeightPx = canvas.height;

                // Set the PDF width to 210mm
                const pdfWidth = 210;

                // Calculate num of pixels per mm based on image width
                const pxPerMm = imgWidthPx / pdfWidth;

                // Get the PDF height so the entire image fits in the PDF properly without being cut off
                const pdfHeight = imgHeightPx / pxPerMm;

                // Create the PDF doc with the dimensions gotten above
                const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);

                // Add the image to the PDF then download it
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('analysis.pdf');
            });
    } catch (error) {
        console.error(error);
    }
}

// Helper function to render color based on score
const getScoreColor = (score: number) => {
    if (score >= 2) return 'text-green-700';
    if (score >= 1) return 'text-yellow-700';
    return 'text-red-700';
};

// Helper function to just get the work to describe the LLM evaluation description word
function getDescriptionForLlmEvaluation(score: number) {
    if (score <= 2) {
        return "(Poor)";
    } else if (score > 2 && score <= 4) {
        return "(Good)";
    } else {
        return "(Amazing)";
    }
}

// Similar helper function to one above, but for topical relevance
function getDescriptionForTopRel(score: number) {
    if (score <= 7) {
        return "(Poor)";
    } else if (score > 7 && score <= 9) {
        return "(Good)";
    } else {
        return "(Amazing)";
    }
}

function determineStrengthsAndWeaknesses(
    { scrapedInfo, llmEvaluation }:
        { scrapedInfo: scrapedInfo, llmEvaluation: LLMEvaluation }
) {
    const arrOfStrengths = [];
    const arrOfWeaknesses = [];
    // will have objects containing the NAME and a MESSAGE explaining it

    // LLM EVALUATION STRENGTH
    const llmEvalScore = llmEvaluation.ranking.score;
    if (llmEvalScore >= 1) {
        const dynamicMessage =
            llmEvalScore === 1 ? "Your URL showed up once! This is actually a very good start and is a solid foundation to build upon." :
            llmEvalScore === 2 ? "Your URL showed up twice! A very strong baseline that very likely outperforms other competitors." :
            llmEvalScore === 3 ? "Your URL showed up three times! Your site has great visibility that can be maximized even further." :
            llmEvalScore === 4 ? "Your URL showed up four times! Your site has incredible recognition which can be even further improved." :
            "Your URL showed up FIVE times, a perfect score! Your site has outstanding visibility which can be improved EVEN FURTHER."
        arrOfStrengths.push({
            name: "LLM Evaluation: How many times did your URL show up in the AI's responses to the questions.",
            message: dynamicMessage
        })
    } else {
        arrOfWeaknesses.push({
            name: "LLM Evaluation: How many times did your URL show up in the AI's responses to the questions.",
            message: "Your site didn't appear in the AI's responses. This suggests search engines and AI tools may not be effectively discovering your content yet."
        });
    }

    // KEYWORD DENSITY STRENGTH
    const numOfOptimalKeywords = scrapedInfo.keywordDensity.filter((keyword) => keyword.densityAsPercent >= 1.25 && keyword.densityAsPercent <= 1.75).length;
    if (numOfOptimalKeywords >= 2) {
        arrOfStrengths.push({
            name: "Keyword Density: Keyword density is how often a word appears compared to the total words. It helps with SEO but should be natural to avoid issues.",
            message: `You have at least 2 keywords that are in the optimal range! In the Keyword Density section above, follow the little tips for those that are not in optimal range (if any).`
        });
    } else {
        arrOfWeaknesses.push({
            name: "Keyword Density: Keyword density is how often a word appears compared to the total words. It helps with SEO but should be natural to avoid issues.",
            message: "Your keyword usage needs some attention. In the Keyword Density section, follow the tips to improve your keyword density which will ultimately help the site's SEO."
        });
    }

    // META DESCRIPTION STRENGTH
    const meta = scrapedInfo.metaDescription;
    const hasKeywordInMeta = scrapedInfo.keywordDensity.some(keyWordObj => meta.includes(keyWordObj.keyword));
    // check if it exists, is between 120 and 160 characters, and check if it has at least ONE keyword in it
    if (meta && meta.length >= 120 && meta.length <= 160 && hasKeywordInMeta) {
        arrOfStrengths.push({
            name: "Meta Description: Meta descriptions are short webpage summaries that help users decide whether to click.",
            message: "You have a perfect meta descrption meaning it is between 120-160 characters and it includes at least one keyword."
        });
    } else {
        const metaIssues = [];
        if (!meta) metaIssues.push("missing entirely");
        else {
            if (meta.length < 120) metaIssues.push("too short");
            if (meta.length > 160) metaIssues.push("too long");
            if (!hasKeywordInMeta) metaIssues.push("missing keywords");
        }
        arrOfWeaknesses.push({
            name: "Meta Description",
            message: `Your meta description needs improvement: ${metaIssues.join(', ')}. Aim for 120-160 characters with at least one target keyword.`
        });
    }

    // TITLE STRENGTH
    const title = scrapedInfo.title;
    const hasKeywordInTitle = scrapedInfo.keywordDensity.some(keyWordObj => title.includes(keyWordObj.keyword));
    // check if it exsits, is between 60 and 80 characters, and at least one keyword
    if (title && title.length >= 60 && title.length <= 80 && hasKeywordInTitle) {
        arrOfStrengths.push({
            name: "Title: Titles are short descriptions that quickly tell the user what the page is about.",
            message: "You have a great title that is between 60-80 characters and it includes at least one keyword."
        });
    } else {
        const titleIssues = [];
        if (!title) titleIssues.push("missing entirely");
        else {
            if (title.length < 60) titleIssues.push("too short");
            if (title.length > 80) titleIssues.push("too long");
            if (!hasKeywordInTitle) titleIssues.push("missing keywords");
        }
        arrOfWeaknesses.push({
            name: "Title Tag",
            message: `Your title needs improvement: ${titleIssues.join(', ')}. Aim for 60-80 characters with at least one target keyword.`
        });
    }

    // HEADERS STRENGTH
    const allHeaders = scrapedInfo.headers;
    const hasH1 = allHeaders.some(header => header.type === 'h1');
    const hasKeywordsInHeaders = allHeaders.some(header => scrapedInfo.keywordDensity.some(keyWordObj => header.text.includes(keyWordObj.keyword)));
    if (
        allHeaders.length > 0 &&
        hasH1 &&
        hasKeywordsInHeaders
    ) {
        arrOfStrengths.push({
            name: "Headers: Headers create a structured layout for a webpage, making content clear and easy to navigate.",
            message: "Your webpage has a strong header structure, including an <h1> tag and include some keyword."
        });
    } else {
        const headerIssues = [];
        if (allHeaders.length < 1) headerIssues.push("no headers detected");
        else {
            if (!hasH1) headerIssues.push("missing H1 tag");
            if (!hasKeywordsInHeaders) headerIssues.push("missing keywords in headers");
        }
        arrOfWeaknesses.push({
            name: "Header Structure",
            message: `Your headers need improvement: ${headerIssues.join(', ')}. Ensure you have one H1 tag per page and include keywords naturally.`
        });
    }

    //TOPICAL RELEVANCE STRENGTH
    const topRel = scrapedInfo.topicalRelevance;
    if (topRel && topRel.score >= 6) {
        arrOfStrengths.push({
            name: "Topical Relevance: An AI analysis where we ask the LLM to determine how well the site conveys the main subject and aligns with the topic",
            message: `At the top of the page, you can find the feedback from AI about the Topical Relevance of your site.`
        });
    } else {
        arrOfWeaknesses.push({
            name: "Content Relevance",
            message: `The content may not fully align with your target topic. At the top of the page, you can find the feedback from AI about the Topical Relevance of your site.`
        });
    }

    // STRUCTURED DATA STRENGTH
    const structuredData = scrapedInfo.structuredData;
    if (structuredData && structuredData.length > 0) {
        arrOfStrengths.push({
            name: "Structured Data: Helps search engines understand your content better for improved indexing and rich results.",
            message: "Your page has structured data, which enhances SEO by helping search engines better interpret and display your content."
        });
    } else {
        arrOfWeaknesses.push({
            name: "Structured Data",
            message: "Your page is missing structured data markup. Adding schema markup can help search engines understand your content better and may enhance your search listings."
        });
    }

    return {
        strengths: arrOfStrengths,
        weaknesses: arrOfWeaknesses
    }
}

export {
    formatHeadersForAI,
    promptToAi,
    getPDF,
    getScoreColor,
    determineStrengthsAndWeaknesses,
    getDescriptionForLlmEvaluation,
    getDescriptionForTopRel,
};