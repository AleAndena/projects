"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [clickedSubmit, setClickedSubmit] = useState(false);

  // check if input is a valid URL
  function validateURL(input: string): boolean{
    // idea taken from: https://medium.com/@tariibaba/javascript-check-if-string-is-url-ddf98d50060a
    try{
      new URL(input);
      return true;
    } catch (error){
      console.error(error);
      return false;
    }
  }

  // handle URL submission
  async function handleSubmission(event: React.FormEvent) : Promise<undefined>{
    event.preventDefault();

    setClickedSubmit(true);

    // check if new url is valid
    const isValidUrl = validateURL(url);
    setIsValid(isValidUrl);

    // if url is valid, analyze the corresponding page 
    if(isValidUrl){      
      const formattedUrl = `/api/scrape/${encodeURIComponent(url)}`;
      const response = await fetch(formattedUrl);
      const doc = await response.json();
      
      console.log('Loaded document ', doc.html);
    }
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-md bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6">URL Submission</h1>
        
        <form onSubmit={handleSubmission} className="space-y-4">
          <div>
            <label htmlFor="url" className="text-sm text-gray-300 mb-1 block">
              Enter a full URL
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={`w-full px-4 py-2 bg-gray-800 text-white border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                !isValid && clickedSubmit ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            {!isValid && clickedSubmit && (
              <p className="mt-1 text-sm text-red-400">Please enter a valid URL (e.g., https://example.com)</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Submit URL
          </button>
        </form>
  
        {isValid && (
          <div className="mt-6 p-4 bg-gray-800 rounded-md border border-gray-700">
            <p className="text-green-400 font-medium">Submitted URL:</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              {url}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}