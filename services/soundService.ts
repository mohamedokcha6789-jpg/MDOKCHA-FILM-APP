import { Howl } from 'howler';

// Sound asset URLs from a CDN that allows cross-origin requests
const SOUND_URLS = {
  click: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3',
  upload: 'https://cdn.pixabay.com/download/audio/2022/03/07/audio_291bb16a7e.mp3',
  remove: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_51499e4d56.mp3',
  start: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_798ebf644f.mp3',
  success: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c352c31f4a.mp3',
  error: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_74c6ea49a1.mp3',
};

// Initialize Howl instances for each sound effect
const sounds = {
  click: new Howl({ src: [SOUND_URLS.click], volume: 0.5 }),
  upload: new Howl({ src: [SOUND_URLS.upload], volume: 0.7 }),
  remove: new Howl({ src: [SOUND_URLS.remove], volume: 0.6 }),
  start: new Howl({ src: [SOUND_URLS.start], volume: 0.4 }),
  success: new Howl({ src: [SOUND_URLS.success], volume: 0.6 }),
  error: new Howl({ src: [SOUND_URLS.error], volume: 0.8 }),
};

// Export functions to be called from components
export const playClick = () => sounds.click.play();
export const playUpload = () => sounds.upload.play();
export const playRemove = () => sounds.remove.play();
export const playStart = () => sounds.start.play();
export const playSuccess = () => sounds.success.play();
export const playError = () => sounds.error.play();
