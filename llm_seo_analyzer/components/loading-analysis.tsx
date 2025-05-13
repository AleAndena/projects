import LottieLoader from "./lottie-loader";

export function LoadingAnalysis(
    { scrapedInfo, llmEvaluation, showCompletion }:
        { scrapedInfo: scrapedInfo | null, llmEvaluation: LLMEvaluation | null, showCompletion: boolean }
) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center max-w-md px-4">

                {/* Lottie loader */}
                <div className="mb-6 flex justify-center">
                    <LottieLoader size={425} />
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