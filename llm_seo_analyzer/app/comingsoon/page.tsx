"use client";

export default function ComingSoon() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-start p-8 ml-[9vw]">
        <h1 className="text-4xl md:text-5xl font-bold tracking-wider mb-6">
          More features coming soon!
        </h1>
        <p className="text-lg md:text-xl font-light text-left max-w-5xl mt-[5vh]">
          Large Language Models like ChatGPT are being used by millions for research and product discovery. If your site isn’t showing up in their answers, you’re invisible to a growing audience.
        </p>
      </div>

      {/* Work With Us Button */}
      <div className="absolute top-4 right-4">
        <button className="bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-full hover:bg-blue-600 transition-colors duration-200">
          work with us
        </button>
      </div>
    </div>
  );
}