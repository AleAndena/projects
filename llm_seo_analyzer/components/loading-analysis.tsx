export function LoadingAnalysis(
    { scrapedInfo, llmEvaluation, showCompletion }:
    { scrapedInfo: scrapedInfo | null, llmEvaluation: LLMEvaluation | null, showCompletion: boolean }
) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center max-w-md px-4">
                {/* Animated spinner */}
                <div className="relative mx-auto h-16 w-16 mb-6">
                    <div className="animate-spin rounded-full h-full w-full border-t-2 border-b-2 border-blue-500 border-opacity-30"></div>
                    <div
                        className="absolute top-0 left-0 h-full w-full animate-spin rounded-full border-t-2 border-blue-600 border-opacity-80"
                        style={{ animationDuration: '2s' }}
                    ></div>
                    <svg
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                </div>

                {/* Progress bar */}
                <div className="mb-8 w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${!scrapedInfo ? '33%' : !llmEvaluation ? '66%' : '100%'}`
                        }}
                    ></div>
                </div>

                {/* Combined step indicators */}
                <div className="space-y-4 text-center">
                    {/* Scraping step */}
                    <div className={`flex items-center justify-center gap-2 ${!scrapedInfo ? 'text-gray-900 font-bold text-lg' : 'text-gray-600'}`}>
                        {scrapedInfo ? (
                            <span className="text-green-500">✓</span>
                        ) : (
                            <span className="animate-bounce">🕵️</span>
                        )}
                        <span>Scraping site content</span>
                    </div>

                    {/* Analysis step */}
                    <div className={`flex items-center justify-center gap-2 ${scrapedInfo && !llmEvaluation ? 'text-gray-900 font-bold text-lg' : 'text-gray-600'}`}>
                        {llmEvaluation ? (
                            <span className="text-green-500">✓</span>
                        ) : scrapedInfo ? (
                            <span className="animate-pulse">🧠</span>
                        ) : null}
                        <span>Running AI analysis</span>
                    </div>

                    {/* Completion step */}
                    <div className={`flex items-center justify-center gap-2 ${showCompletion ? 'text-gray-900 font-bold text-lg' : 'text-gray-400'}`}>
                        {showCompletion ? (
                            <span className="animate-bounce">✅</span>
                        ) : (
                            <span className="opacity-0">✓</span>
                        )}
                        <span>Analysis complete</span>
                    </div>
                </div>
            </div>
        </div>
    );
}