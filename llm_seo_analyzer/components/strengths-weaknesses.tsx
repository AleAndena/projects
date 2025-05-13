"use client";
import { useState } from 'react';

export function StrengthsWeaknesses ({ 
  strengths, 
  weaknesses 
}: {
  strengths: strengthWeakness[],
  weaknesses: strengthWeakness[]
}) {
  const [activeTab, setActiveTab] = useState('strengths');
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-white">Site Analysis Summary</h2>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-4">
        <button 
          onClick={() => setActiveTab('strengths')} 
          className={`py-2 px-4 font-medium text-sm mr-2 transition-colors duration-200 ${
            activeTab === 'strengths' 
              ? 'text-white border-b-2 border-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Strengths ({strengths.length})
        </button>
        <button 
          onClick={() => setActiveTab('weaknesses')} 
          className={`py-2 px-4 font-medium text-sm transition-colors duration-200 ${
            activeTab === 'weaknesses' 
              ? 'text-white border-b-2 border-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Weaknesses ({weaknesses.length})
        </button>
        <button 
          className="py-2 px-4 font-medium text-sm text-gray-400 hover:text-white transition-colors duration-200"
        >
          Keyword Density
        </button>
      </div>
      
      {/* Content Section */}
      <div className="space-y-4">
        {activeTab === 'strengths' ? (
          strengths.length > 0 ? (
            strengths.map((item, index: number) => (
              <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-700 rounded-r-lg">
                <h3 className="font-medium text-white">{item.name}</h3>
                <p className="text-sm text-gray-300 mt-1">{item.message}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic">No strengths detected.</p>
          )
        ) : (
          weaknesses.length > 0 ? (
            weaknesses.map((item, index: number) => (
              <div key={index} className="border-l-4 border-red-500 pl-4 py-2 bg-gray-700 rounded-r-lg">
                <h3 className="font-medium text-white">{item.name}</h3>
                <p className="text-sm text-gray-300 mt-1">{item.message}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic">No weaknesses detected.</p>
          )
        )}
      </div>
    </div>
  );
};