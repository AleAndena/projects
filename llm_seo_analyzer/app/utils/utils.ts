import OpenAI from 'openai';

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