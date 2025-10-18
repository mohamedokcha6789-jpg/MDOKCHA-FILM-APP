import React from 'react';
import saveAs from 'file-saver';
import { Scene } from '../types';
import { BackIcon } from './icons/BackIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ZoomIcon } from './icons/ZoomIcon';
import { playClick } from '../services/soundService';

interface ScenarioDisplayProps {
  scenes: Scene[];
  onGoBack: () => void;
  onImageClick: (imageUrl: string) => void;
  onRegenerateScene: (index: number) => void;
  regeneratingSceneIndex: number | null;
  onDownloadAll: () => void;
}

const ScenarioDisplay: React.FC<ScenarioDisplayProps> = ({
  scenes,
  onGoBack,
  onImageClick,
  onRegenerateScene,
  regeneratingSceneIndex,
  onDownloadAll,
}) => {

  const handleDownloadImage = (imageUrl: string, index: number) => {
    playClick();
    saveAs(imageUrl, `scene_${index + 1}.jpeg`);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          قصتك المصورة
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <BackIcon />
            <span className="ml-2">العودة للبداية</span>
          </button>
          <button
            onClick={onDownloadAll}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <DownloadIcon />
            <span className="ml-2">تحميل الكل</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {scenes.map((scene, index) => (
          <div key={index} className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col group">
            <div className="relative aspect-video overflow-hidden">
                <img src={scene.imageUrl} alt={`مشهد ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div 
                    onClick={() => onImageClick(scene.imageUrl)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <ZoomIcon />
                </div>
            </div>
            <div className="p-5 flex-grow flex flex-col">
              <p className="text-gray-300 text-sm mb-4 flex-grow">
                {scene.description}
              </p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-sm font-bold text-gray-400">مشهد {index + 1}</span>
                 <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadImage(scene.imageUrl, index)}
                      disabled={regeneratingSceneIndex !== null}
                      className="p-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                      aria-label="Download image"
                      title="تنزيل الصورة"
                    >
                      <DownloadIcon />
                    </button>
                    <button
                      onClick={() => onRegenerateScene(index)}
                      disabled={regeneratingSceneIndex !== null}
                      className="inline-flex items-center text-xs px-3 py-2 font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                      {regeneratingSceneIndex === index ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <RefreshIcon />
                          <span className="ml-1.5">إعادة إنشاء</span>
                        </>
                      )}
                    </button>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenarioDisplay;