import { getDescriptionForTopRel } from "@/app/utils/utils";

export function TopRelCard({ topicalRel, topRelPercentage }: { topicalRel: topicalRelevance, topRelPercentage: number }) {
    return (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
                <div className="flex items-center">
                    {/* https://daisyui.com/components/radial-progress/ */}
                    {/* Donut graph to show the score */}
                    <div className={`radial-progress ${topicalRel!.score <= 6 ? "text-secondary" : "text-primary"} mr-4`}
                        style={{ "--value": topRelPercentage!, "--size": "3vw", "--thickness": "0.5vw" } as React.CSSProperties}
                        aria-valuenow={topRelPercentage!}
                        role="progressbar">
                    </div>
                    <div>
                        <div className="text-xl font-bold">
                            {topicalRel.score}/10 {getDescriptionForTopRel(topicalRel.score)}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Topical Relevance</div>
                    </div>
                </div>
            </div>
        </div>
    );
}