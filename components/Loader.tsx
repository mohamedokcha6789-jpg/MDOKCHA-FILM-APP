import React from 'react';
import { LoadingStep } from '../types';

interface LoaderProps {
  loadingStep: LoadingStep;
  progress: {
    current: number;
    total: number;
  };
}

export const Loader: React.FC<LoaderProps> = ({ loadingStep, progress }) => {
  const isGeneratingImages = loadingStep === LoadingStep.GENERATING_IMAGES;
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-lg shadow-xl text-white max-w-2xl mx-auto">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6"></div>
      <h2 className="text-2xl font-bold mb-2">{loadingStep}</h2>
      {isGeneratingImages && progress.total > 0 && (
        <div className="w-full mt-4">
           <p className="mb-2 text-sm">{`جاري إنشاء المشهد ${progress.current} من ${progress.total}`}</p>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className="bg-purple-600 h-4 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loader;
