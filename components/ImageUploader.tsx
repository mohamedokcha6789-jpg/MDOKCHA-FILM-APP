import React, { useState, ChangeEvent } from 'react';
import { CharacterImage } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { playUpload, playRemove } from '../services/soundService';

interface ImageUploaderProps {
  onImagesChange: (images: CharacterImage[]) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, disabled }) => {
  const [images, setImages] = useState<CharacterImage[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filePromises = Array.from(files).map(file => {
      return new Promise<CharacterImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string)?.split(',')[1];
          if (base64) {
            resolve({ file, base64, age: 25 }); // Default age set to 25
          } else {
            reject(new Error('Failed to read file as base64.'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(newImages => {
      if (newImages.length > 0) {
        playUpload();
      }
      setImages(prevImages => {
        const updatedImages = [...prevImages, ...newImages];
        onImagesChange(updatedImages);
        return updatedImages;
      });
    }).catch(error => console.error("Error reading files:", error));
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleAgeChange = (index: number, newAge: number) => {
    const newImages = [...images];
    newImages[index].age = newAge;
    setImages(newImages);
    onImagesChange(newImages);
  };

  const removeImage = (index: number) => {
    playRemove();
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-4 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${
          dragActive ? 'border-purple-500 bg-gray-800' : 'border-gray-600 hover:border-purple-400'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            multiple 
            accept="image/jpeg, image/png"
            onChange={handleChange}
            disabled={disabled}
        />
        <label htmlFor="file-upload" className={`flex flex-col items-center text-gray-400 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <UploadIcon />
            <p className="mt-4 text-lg">اسحب وأفلت صور شخصياتك هنا، أو انقر لاختيار الملفات</p>
            <p className="text-sm">(PNG, JPG)</p>
        </label>
      </div>
      
      {images.length > 0 && (
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <div key={`${image.file.name}-${index}`} className="relative group overflow-hidden rounded-lg">
              <img
                src={URL.createObjectURL(image.file)}
                alt={`شخصية ${index + 1}`}
                className="w-full h-auto aspect-square object-cover shadow-lg"
              />
              <div className="absolute top-0 left-0 right-0 p-1 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-center">
                  <label htmlFor={`age-${index}`} className="text-white text-xs mr-2 font-semibold">العمر:</label>
                  <select
                    id={`age-${index}`}
                    value={image.age || 25}
                    onChange={(e) => handleAgeChange(index, parseInt(e.target.value))}
                    disabled={disabled}
                    className="bg-gray-900/50 text-white text-xs rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 py-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Array.from({ length: 100 }, (_, i) => i + 1).map(ageNum => (
                      <option key={ageNum} value={ageNum}>{ageNum}</option>
                    ))}
                  </select>
                </div>
              <button
                onClick={() => !disabled && removeImage(index)}
                className={`absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label="Remove image"
                disabled={disabled}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;