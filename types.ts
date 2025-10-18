export interface Scene {
  description: string;
  imageUrl: string;
}

export interface CharacterImage {
  file: File;
  base64: string;
  age?: number;
}

export enum LoadingStep {
  IDLE = 'جاهز',
  ANALYZING = 'تحليل الشخصيات وكتابة السيناريو...',
  GENERATING_IMAGES = 'إنشاء صور المشاهد...',
  DONE = 'اكتمل',
}
