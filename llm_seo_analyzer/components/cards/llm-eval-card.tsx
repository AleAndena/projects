import { getDescriptionForLlmEvaluation } from "@/app/utils/utils";

export function LlmEvalCard({llmEval, llmPercentage}: {llmEval: LLMEvaluation, llmPercentage: number}) {
    return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center">
            <div className="flex items-center">
                {/* https://daisyui.com/components/radial-progress/ */}
                {/* Donut graph to show the score */}
                <div className={`radial-progress ${llmEval.ranking.score <= 2 ? "text-secondary" : "text-primary"} mr-4`}
                    style={{ "--value": llmPercentage, "--size": "3vw", "--thickness": "0.5vw" } as React.CSSProperties}
                    aria-valuenow={llmPercentage}
                    role="progressbar">
                </div>
                <div>
                    <div className="text-xl font-bold">
                        {llmEval.ranking.score}/5 {getDescriptionForLlmEvaluation(llmEval.ranking.score)}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">LLM Evaluation</div>
                </div>
            </div>
        </div>
    </div>);
}