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
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Site Analysis Summary</h2>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button 
          onClick={() => setActiveTab('strengths')} 
          className={`py-2 px-4 font-medium text-sm mr-2 rounded-t-lg transition-colors duration-200 ${
            activeTab === 'strengths' 
              ? 'bg-green-50 text-green-700 border-b-2 border-green-600' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Strengths ({strengths.length})
        </button>
        <button 
          onClick={() => setActiveTab('weaknesses')} 
          className={`py-2 px-4 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
            activeTab === 'weaknesses' 
              ? 'bg-red-50 text-red-700 border-b-2 border-red-600' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Weaknesses ({weaknesses.length})
        </button>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        {activeTab === 'strengths' ? (
          strengths.length > 0 ? (
            strengths.map((item, index: number) => (
              <div key={index} className="border-l-4 border-green-600 pl-4 py-2 bg-green-50 rounded-r-lg">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-700 mt-1">{item.message}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-700 italic">No strengths detected.</p>
          )
        ) : (
          weaknesses.length > 0 ? (
            weaknesses.map((item, index: number) => (
              <div key={index} className="border-l-4 border-red-600 pl-4 py-2 bg-red-50 rounded-r-lg">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-700 mt-1">{item.message}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-700 italic">No weaknesses detected.</p>
          )
        )}
      </div>
    </div>
  );
};