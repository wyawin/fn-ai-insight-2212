import React, { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Transaction, AnalysisResult } from './types';
import { parseCSV } from './utils/csvParser';
import { createChunks } from './utils/chunkProcessor';
import { OpenAIService } from './services/openaiService';

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      // Parse CSV
      const transactions: Transaction[] = await parseCSV(file);
      
      // Create chunks
      const chunks = createChunks(transactions);

      // Initialize OpenAI service
      const openAI = new OpenAIService(
        import.meta.env.VITE_AZURE_API_KEY,
        import.meta.env.VITE_AZURE_ENDPOINT,
        import.meta.env.VITE_AZURE_DEPLOYMENT
      );

      // Process chunks sequentially while maintaining context
      const chunkSummaries = [];
      let previousSummary = '';

      for (const chunk of chunks) {
        const summary = await openAI.analyzeChunk(chunk, previousSummary);
        chunkSummaries.push(summary);
        previousSummary = summary;
      }

      // Generate final analysis
      const finalAnalysis = await openAI.generateFinalAnalysis(chunkSummaries);
      setAnalysis(finalAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bank Statement Analyzer
          </h1>
          <p className="text-gray-600">
            Upload your bank statement CSV to get comprehensive financial insights
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV file with bank statements</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isAnalyzing}
              />
            </label>
          </div>
        </div>

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Analyzing your bank statements...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Financial Analysis Summary
              </h2>
              <p className="text-gray-700" style={{whiteSpace: 'break-spaces'}}>{analysis.final}</p>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Chunk Analysis Summary
              </h2>
              <p className="text-gray-700" style={{whiteSpace: 'break-spaces'}}>{analysis.allSummaries}</p>
            </div>

            {/* <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                All
              </h3>
              <ul className="space-y-2">
                {analysis.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <FileText className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Recommendations
              </h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mr-2">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;