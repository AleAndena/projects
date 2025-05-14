export function KeywordDensityDisplay({
  keyword,
  densityAsPercent,
  count,
}: {
  keyword: string;
  densityAsPercent: number;
  count: number;
}) {
  // Determine message based on density percentage
  const getDensityFeedback = (density: number) => {
    if (density >= 2.5) {
      return "Too high - may be seen as keyword stuffing";
    } else if (density >= 2.0 && density < 2.5) {
      return "Getting high - consider possibly reducing slightly";
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
    if (density >= 2.5) return "text-red-400";
    if (density >= 2.25) return "text-yellow-400";
    if (density >= 1.9) return "text-yellow-300";
    if (density >= 1.1) return "text-green-400";
    if (density >= 0.75) return "text-yellow-300";
    if (density >= 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  // Create segments for the density bar (total of 30 segments)
  const MAX_SEGMENTS = 30;
  const MAX_DENSITY = 3.0; // 3% max on the scale

  // Get segment colors based on position in the spectrum
  const getSegmentColor = (index: number) => {
    const segmentValue = ((index + 1) / MAX_SEGMENTS) * MAX_DENSITY;

    if (segmentValue >= 2.5) return "bg-red-500";
    if (segmentValue >= 2.25) return "bg-yellow-500";
    if (segmentValue >= 1.9) return "bg-yellow-400";
    if (segmentValue >= 1.1) return "bg-green-500";
    if (segmentValue >= 0.75) return "bg-yellow-400";
    if (segmentValue >= 0.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  // How many segments should be filled based on the density
  const filledSegments = Math.ceil((densityAsPercent / MAX_DENSITY) * MAX_SEGMENTS);

  // Feedback message and text color
  const feedbackMessage = getDensityFeedback(densityAsPercent);
  const textColor = getTextColor(densityAsPercent);

  return (
    <div className="mb-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-white text-lg">{keyword}</span>
        <span className={`text-sm font-medium ${textColor}`}>
          {densityAsPercent.toFixed(2)}% ({count} occurrences)
        </span>
      </div>

      {/* Segmented visualization bar */}
      <div className="flex h-4 w-full gap-px rounded overflow-hidden">
        {[...Array(MAX_SEGMENTS)].map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 ${
              i < filledSegments ? getSegmentColor(i) : "bg-gray-600"
            }`}
          ></div>
        ))}
      </div>

      {/* Feedback message */}
      <div className={`text-sm mt-2 ${textColor}`}>
        {feedbackMessage}
      </div>
    </div>
  );
}