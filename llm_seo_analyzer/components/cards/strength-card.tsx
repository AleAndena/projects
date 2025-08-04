import Image from 'next/image';

export function StrengthCard({ strengthLength }: {
    strengthLength: number
}) {
    return (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                <Image src="/strong.png" alt="flexing bicep logo" width="24" height="24" />
            </div>
            <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold text-white">
                    {strengthLength}
                </div>
                <div className="text-sm text-gray-400">STRENGTHS</div>
            </div>
        </div>
    );
}