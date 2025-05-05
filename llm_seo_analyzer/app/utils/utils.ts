import OpenAI from 'openai';
import html2canvas from 'html2canvas';
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

export {
    formatHeadersForAI,
    promptToAi
};

// Source of logic for making the PDF:
// https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/
function getPDF() {
    try{
        const domElement = document.getElementById('analysis-page');
        const pdfButton = document.getElementById('get-pdf-button');
    
        if (!pdfButton || !domElement) {
            throw new Error("Could not find `analysis-page` or `get-pdf-button` element");
        }
    
        html2canvas(domElement, {
            onclone: (document) => {
                pdfButton.style.visibility = 'hidden';
            }
        })
        .then((canvas) => {
            const img = canvas.toDataURL('image/png');
            const pdf = new jsPDF();

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(img, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('LLM-SEO-analysis.pdf');
        })

    }catch(error){
        console.error(error);
    }
    
}