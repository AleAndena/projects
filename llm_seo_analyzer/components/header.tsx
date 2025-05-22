import Image from 'next/image';

export function Header() {
    return (
        <div className="mb-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">LLM SEO Analyzer</h1>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm">
                    work with us
                </button>
            </div>
            <p className="text-gray-400 mt-2">
                Instantly see how your site ranks in LLMs & search engines. Our SEO LLM Analyzer shows you how often your site is actually recommended by AI-and why.
            </p>

            {/* LLM Icons */}
            <div className="flex space-x-6 mt-6 max-w-lg">
                <Image src="/open-ai-logo.png" alt="open ai logo" width="250" height="41" />
                <Image src="/claude-logo.png" alt="claude logo" width="220" height="48" />
                <Image src="/google-ai-logo.png" alt="google ai logo" width="204" height="49" />
                <Image src="/bing-logo.png" alt="bing logo" width="130" height="53" />
            </div>
        </div>)
}