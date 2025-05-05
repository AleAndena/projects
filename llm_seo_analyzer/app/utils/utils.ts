import OpenAI from 'openai';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

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

export {
    formatHeadersForAI,
    promptToAi,
    getPDF
};