"use client";

import Link from "next/link";
import Image from 'next/image';
import { usePathname } from "next/navigation";

export function SideBar() {
    const pathname = usePathname();

    {/* Sidebar code*/ }
    return (<div className="w-16 bg-black min-h-[95vh] border-2 border-gray-800 flex flex-col items-center py-6 space-y-6 rounded-lg m-2">
        <div className="group relative">
            <div>
                <Link href="https://www.incubella.co"><Image src="/incubella-icon-color.png" alt="Home nav bar logo" width="32" height="32" /></Link>
            </div>
            <span className="absolute left-full ml-2 w-24 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">Incubella Home Page</span>
        </div>
        <div className="group relative">
            {/* <div className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"> */}
            <div className={`p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 ${pathname === '/' ? 'bg-gray-700' : ''}`}>
                <Link href="/"><Image src="/menu.png" alt="Main page nav bar logo" width="32" height="32" /></Link>
            </div>
            <span className="absolute left-full ml-2 w-24 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">Analysis Page</span>
        </div>
        <div className="group relative">
            {/* <div className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"> */}
            <div className={`p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 ${pathname === '/comingsoon' ? 'bg-gray-700' : ''}`}>
                <Link href="/comingsoon"><Image src="/shield-plus.png" alt="Coming soon nav bar logo" width="32" height="32" /></Link>
            </div>
            <span className="absolute left-full ml-2 w-24 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">Coming Soon!</span>
        </div>
    </div>);
}
