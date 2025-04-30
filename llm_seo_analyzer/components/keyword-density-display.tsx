export function KeywordDensityDisplay(
    { keyword, densityAsPercent, count }:
    { keyword: string, densityAsPercent: number, count: number }
) {
    // Determine message based on density percentage
    const getDensityFeedback = (density: number) => {
        if (density >= 2.5) {
            return "Too high - may be seen as keyword stuffing";
        } else if (density >= 2.0 && density < 2.5) {
            return "Getting high - consider reducing slightly";
        } else if (density >= 1.75 && density < 2.0) {
            return "Good, but on the higher side";
        } else if (density >= 1.25 && density < 1.75) {
            return "Optimal keyword density";
        } else if (density >= 1.0 && density < 1.25) {
            return "Good, but could be higher";
        } else if (density >= 0.5 && density < 1.0) {
            return "Low - consider increasing usage";
        } else {
            return "Too low - increase keyword usage";
        }
    };

    // Get text color based on density percentage
    const getTextColor = (density: number) => {
        if (density >= 2.5 || density < 0.5) {
            return 'text-red-700';
        } else if ((density >= 2.0 && density < 2.5) || (density >= 0.5 && density < 1.0)) {
            return 'text-yellow-700';
        } else if ((density >= 1.75 && density < 2.0) || (density >= 1.0 && density < 1.25)) {
            return 'text-yellow-600';
        } else {
            return 'text-green-700';
        }
    };

    // Create segments for the density bar (total of 30 segments)
    const MAX_SEGMENTS = 30;
    const MAX_DENSITY = 3.0; // 3% max on the scale

    // Get segment colors based on position in the spectrum
    const getSegmentColor = (index: number) => {
        const segmentValue = (index / MAX_SEGMENTS) * MAX_DENSITY;

        if (segmentValue >= 2.5) return 'bg-red-700';
        if (segmentValue >= 2.0) return 'bg-yellow-700';
        if (segmentValue >= 1.75) return 'bg-yellow-500';
        if (segmentValue >= 1.25) return 'bg-green-600';
        if (segmentValue >= 1.0) return 'bg-yellow-500';
        if (segmentValue >= 0.5) return 'bg-yellow-700';
        return 'bg-red-700';
    };

    // How many segments should be filled based on the density
    const filledSegments = Math.ceil((densityAsPercent / MAX_DENSITY) * MAX_SEGMENTS);

    // Feedback message and text color
    const feedbackMessage = getDensityFeedback(densityAsPercent);
    const textColor = getTextColor(densityAsPercent);

    return (
        <div className="mb-6">
            <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-900">{keyword}</span>
                <span className={`text-sm font-medium ${textColor}`}>
                    {densityAsPercent.toFixed(2)}% ({count} occurrences)
                </span>
            </div>

            {/* Segmented visualization bar */}
            <div className="flex h-6 w-full gap-px rounded overflow-hidden">
                {[...Array(MAX_SEGMENTS)].map((_, i) => (
                    <div
                        key={i}
                        className={`h-full grow ${i < filledSegments ? getSegmentColor(i) : 'bg-gray-200'}`}
                    ></div>
                ))}
            </div>

            {/* Feedback message */}
            <div className={`text-xs mt-1 ${textColor}`}>
                {feedbackMessage}
            </div>
        </div>
    );
};