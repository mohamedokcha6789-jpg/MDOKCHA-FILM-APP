import React, { useState } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { CharacterImage, Scene, LoadingStep } from './types';
import { generateStoryboard, generateImageForScene } from './services/geminiService';
import { playClick, playStart, playSuccess, playError } from './services/soundService';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import ScenarioDisplay from './components/ScenarioDisplay';
import ImageModal from './components/ImageModal';
import { SparklesIcon } from './components/icons/SparklesIcon';

const GENRE_DETAILS: { [key: string]: string[] } = {
  "فنتازيا": ["نبوءة قديمة تتحقق", "اكتشاف مخلوق سحري", "مهمة للبحث عن قطعة أثرية", "معركة بين النور والظلام"],
  "خيال علمي": ["أول اتصال مع فضائيين", "ذكاء اصطناعي يسيطر على العالم", "السفر عبر الزمن بعواقبه", "البقاء على قيد الحياة بكوكب مهجور"],
  "رعب": ["تحقيق في بيت مسكون", "الهروب من مخلوق وحشي", "إثارة نفسية تتكشف فصولها", "غرض ملعون يجلب الهلاك"],
  "كوميديا": ["خطأ فادح في تحديد الهوية", "رحلة برية تسوء بشكل فظيع", "صداقة غير متوقعة تتشكل", "منافسة ذات رهانات سخيفة"],
  "دراما": ["كشف سر عائلي مدفون", "التغلب على تحدٍ شخصي عظيم", "اتخاذ قرار أخلاقي صعب", "قصة عن الحب والفقد"],
  "غموض": ["حل لغز جريمة قتل كلاسيكي", "كشف مؤامرة حكومية", "قضية شخص مفقود غامضة", "فك رموز سلسلة من الأدلة"],
  "أكشن": ["عملية سرقة محفوفة بالمخاطر", "مهمة إنقاذ يائسة", "الانتقام من عدو قوي", "سباق مع الزمن لوقف كارثة"],
  "سايبربانك": ["سرقة بيانات بمدينة نيون", "آلي يقاتل من أجل حريته", "استكشاف الجانب المظلم للتكنولوجيا", "ثورة ضد شركة عملاقة"],
  "رومانسية": ["حب ممنوع يجد طريقه", "فرصة ثانية في الحب", "لقاء صدفة يغير كل شيء", "علاقة حب عن بعد تواجه التحديات"],
};

const GENRES = Object.keys(GENRE_DETAILS);

type MovieSize = 'small' | 'medium' | 'large';
type AspectRatio = '16:9' | '1:1' | '9:16';


const MOVIE_SIZE_CONFIG: Record<MovieSize, { min: number; max: number; default: number }> = {
  small: { min: 1, max: 6, default: 5 },
  medium: { min: 7, max: 9, default: 8 },
  large: { min: 10, max: 20, default: 12 },
};

const App: React.FC = () => {
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [subGenre, setSubGenre] = useState(GENRE_DETAILS[GENRES[0]][0]);
  const [movieSize, setMovieSize] = useState<MovieSize>('small');
  const [sceneCount, setSceneCount] = useState<number>(MOVIE_SIZE_CONFIG.small.default);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(LoadingStep.IDLE);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [uploaderKey, setUploaderKey] = useState(Date.now());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null);

  const isLoading = loadingStep !== LoadingStep.IDLE && loadingStep !== LoadingStep.DONE;

  const handleGenerate = async () => {
    if (characterImages.length === 0) {
      setError("الرجاء تحميل صورة شخصية واحدة على الأقل.");
      playError();
      return;
    }
    setError(null);
    setScenes([]);
    setLoadingStep(LoadingStep.ANALYZING);
    setProgress({ current: 0, total: 0 });
    playStart();

    try {
      await generateStoryboard(
        characterImages,
        userPrompt,
        genre,
        subGenre,
        sceneCount,
        aspectRatio,
        (current, total) => {
          setLoadingStep(LoadingStep.GENERATING_IMAGES);
          setProgress({ current, total });
        },
        (newScene) => {
           setScenes(prevScenes => [...prevScenes, newScene]);
        }
      );
      setLoadingStep(LoadingStep.DONE);
      playSuccess();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "حدث خطأ غير معروف. الرجاء المحاولة مرة أخرى.");
      setLoadingStep(LoadingStep.IDLE);
      playError();
    }
  };
  
  const handleGoBack = () => {
    playClick();
    setScenes([]);
    setError(null);
    setLoadingStep(LoadingStep.IDLE);
  };
  
  const handleRegenerateScene = async (index: number) => {
    if (regeneratingSceneIndex !== null) return;

    setRegeneratingSceneIndex(index);
    setError(null);
    playStart();

    try {
      const sceneToRegenerate = scenes[index];
      const newImageUrl = await generateImageForScene(sceneToRegenerate.description, characterImages, aspectRatio);
      
      const updatedScenes = [...scenes];
      updatedScenes[index] = { ...sceneToRegenerate, imageUrl: newImageUrl };
      setScenes(updatedScenes);
      playSuccess();

    } catch (e: any) {
      console.error(e);
      setError(e.message || "فشل في إعادة إنشاء الصورة. الرجاء المحاولة مرة أخرى.");
      playError();
    } finally {
      setRegeneratingSceneIndex(null);
    }
  };
  
  const handleDownloadAll = async () => {
    playClick();
    if (scenes.length === 0) return;
    
    const zip = new JSZip();
    
    await Promise.all(scenes.map(async (scene, index) => {
      try {
        const response = await fetch(scene.imageUrl);
        const blob = await response.blob();
        zip.file(`scene_${index + 1}.jpeg`, blob);
      } catch (error) {
        console.error(`Failed to fetch image for scene ${index + 1}`, error);
        zip.file(`scene_${index + 1}_error.txt`, `Failed to download image: ${scene.imageUrl}`);
      }
    }));

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'MDOKCHA_storyboard.zip');
    });
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    playClick();
    const newGenre = e.target.value;
    setGenre(newGenre);
    setSubGenre(GENRE_DETAILS[newGenre][0]);
  };
  
  const handleMovieSizeChange = (size: MovieSize) => {
    playClick();
    setMovieSize(size);
    setSceneCount(MOVIE_SIZE_CONFIG[size].default);
  }

  const renderSceneCountOptions = () => {
    const { min, max } = MOVIE_SIZE_CONFIG[movieSize];
    const options = [];
    for (let i = min; i <= max; i++) {
      options.push(<option key={i} value={i}>{i} مشهد</option>);
    }
    return options;
  };

  const isReadyToGenerate = characterImages.length > 0 && !isLoading;

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-purple-500 to-cyan-400">
              MDOKCHA
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            مولد القصص المصورة بالذكاء الاصطناعي. حمّل شخصياتك، وشاهد رؤيتك تتحول إلى حقيقة.
          </p>
        </header>

        {scenes.length === 0 && !isLoading && (
          <div className="max-w-4xl mx-auto bg-gray-800/50 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-700">
            <div className="space-y-8">
              <div>
                <label className="block text-lg sm:text-xl font-bold mb-3 text-gray-200">١. حمّل شخصياتك</label>
                <ImageUploader onImagesChange={setCharacterImages} disabled={isLoading} key={uploaderKey} />
              </div>
              
              <div>
                <label htmlFor="genre" className="block text-lg sm:text-xl font-bold mb-3 text-gray-200">٢. اختر نوع القصة</label>
                <select
                  id="genre"
                  value={genre}
                  onChange={handleGenreChange}
                  disabled={isLoading}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div key={genre} className="animate-fadeIn">
                <label className="block text-lg sm:text-xl font-bold mb-3 text-gray-200">٣. اختر فكرة القصة</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GENRE_DETAILS[genre].map((idea) => (
                    <button
                      key={idea}
                      onClick={() => { setSubGenre(idea); playClick(); }}
                      disabled={isLoading}
                      className={`p-3 text-right w-full rounded-lg transition-all duration-200 text-sm md:text-base ${
                        subGenre === idea
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-lg'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg sm:text-xl font-bold mb-3 text-gray-200">٤. حدد طول القصة</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {(Object.keys(MOVIE_SIZE_CONFIG) as MovieSize[]).map(size => (
                        <button key={size} onClick={() => handleMovieSizeChange(size)} disabled={isLoading}
                          className={`p-3 rounded-lg transition-all duration-200 ${movieSize === size ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير'}
                        </button>
                    ))}
                </div>
                 <select
                  id="sceneCount"
                  value={sceneCount}
                  onChange={(e) => {
                    setSceneCount(parseInt(e.target.value));
                    playClick();
                  }}
                  disabled={isLoading}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  {renderSceneCountOptions()}
                </select>
              </div>

               <div>
                <label className="block text-lg sm:text-xl font-bold mb-3 text-gray-200">٥. حدد أبعاد الصورة</label>
                <div className="grid grid-cols-3 gap-3">
                    {([
                        { value: '16:9', label: 'عرضي' },
                        { value: '1:1', label: 'مربع' },
                        { value: '9:16', label: 'طولي' }
                    ] as const).map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => { setAspectRatio(value); playClick(); }}
                            disabled={isLoading}
                            className={`py-3 px-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center space-y-2 text-sm sm:text-base ${
                                aspectRatio === value
                                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                    : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        >
                            <div className={`bg-gray-500/50 rounded-sm ${
                                value === '16:9' ? 'w-10 h-6' : 
                                value === '1:1' ? 'w-8 h-8' : 
                                'w-6 h-10'
                            }`}></div>
                            <span className="mt-2">{label}</span>
                        </button>
                    ))}
                </div>
              </div>

              <div>
                <label htmlFor="user-prompt" className="block text-lg sm:text-xl font-bold mb-3 text-gray-200">٦. أضف تفاصيلك الخاصة (اختياري)</label>
                <textarea
                  id="user-prompt"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  disabled={isLoading}
                  placeholder="مثال: رحلة بطل إلى مدينة منسية..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  rows={3}
                />
              </div>

              {error && <p className="text-red-400 text-center">{error}</p>}
              
              <div className="text-center pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={!isReadyToGenerate}
                  className="inline-flex items-center justify-center px-8 py-3 sm:px-12 sm:py-4 text-lg sm:text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <SparklesIcon />
                  <span className="ml-3">أنشئ القصة المصورة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {scenes.length > 0 && !isLoading && (
            <ScenarioDisplay 
              scenes={scenes} 
              onGoBack={handleGoBack} 
              onImageClick={setSelectedImageUrl}
              onRegenerateScene={handleRegenerateScene}
              regeneratingSceneIndex={regeneratingSceneIndex}
              onDownloadAll={handleDownloadAll}
            />
        )}
        
        {isLoading && (
          <div className="mt-8">
            {scenes.length > 0 && (
               <ScenarioDisplay 
                scenes={scenes} 
                onGoBack={() => {}} 
                onImageClick={setSelectedImageUrl}
                onRegenerateScene={() => {}}
                regeneratingSceneIndex={regeneratingSceneIndex}
                onDownloadAll={() => {}}
              />
            )}
            <div className="mt-8">
              <Loader loadingStep={loadingStep} progress={progress} />
            </div>
          </div>
        )}


      </main>

      {isLoading && loadingStep === LoadingStep.GENERATING_IMAGES && progress.total > 0 && (
        <div className="fixed bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-fadeIn" style={{ animationDuration: '0.2s' }}>
          <p className="font-bold text-lg tracking-wider">{progress.current} / {progress.total}</p>
        </div>
      )}

      <ImageModal imageUrl={selectedImageUrl} onClose={() => setSelectedImageUrl(null)} />
    </div>
  );
};

export default App;