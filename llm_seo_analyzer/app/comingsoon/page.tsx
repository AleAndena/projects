"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ComingSoon() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-16 bg-black min-h-[95vh] border-2 border-gray-800 flex flex-col items-center py-6 space-y-6 rounded-lg m-2">
        <div className="group relative">
          <div>
            <Link href="https://www.incubella.co">
              <Image src="/incubella-icon-color.png" alt="Home nav bar logo" width="32" height="32" />
            </Link>
          </div>
          <span className="absolute left-full ml-2 w-24 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">
            Incubella Home Page
          </span>
        </div>
        <div className="group relative">
          <div className={`p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 ${pathname === '/' ? 'bg-gray-700' : ''}`}>
            <Link href="/">
              <Image src="/menu.png" alt="Main page nav bar logo" width="32" height="32" />
            </Link>
          </div>
          <span className="absolute left-full ml-2 w-24 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">
            Analysis Page
          </span>
        </div>
        <div className="group relative">
          <div className={`p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 ${pathname === '/comingsoon' ? 'bg-gray-700' : ''}`}>
            <Link href="/comingsoon">
              <Image src="/shield-plus.png" alt="Coming soon nav bar logo" width="32" height="32" />
            </Link>
          </div>
          <span className="absolute left-full ml-2 w-24 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">
            Coming Soon!
          </span>
        </div>
      </div>

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