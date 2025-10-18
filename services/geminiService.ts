import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Scene, CharacterImage } from '../types';

// تم وضع مفتاح الواجهة البرمجية الخاص بك هنا مباشرة.
const API_KEY = "AIzaSyBXwGvYQcckGQIe1PcrPBP9XVPxaipl0zo";

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

const generateScenarioText = async (images: CharacterImage[], userPrompt: string, genre: string, subGenre: string, sceneCount: number): Promise<string[]> => {
  const model = 'gemini-2.5-flash';
  
  const characterDescriptions = images.map((img, i) => 
    `Character ${i + 1}: A person approximately ${img.age || 25} years old.`
  ).join('\n');

  const prompt = `
    You will be given images of characters, their approximate ages, and a story concept. Your task is to create a short, ${sceneCount}-scene visual storyboard script.

    --- CHARACTERS ---
    ${characterDescriptions}
    --- END CHARACTERS ---

    --- STORY CONCEPT ---
    Genre: "${genre}"
    Story Idea: "${subGenre}"
    User's additional notes: "${userPrompt || 'None. The user did not provide any additional notes. Base the story on the characters, genre, and story idea.'}"
    --- END STORY CONCEPT ---
    
    --- CRITICAL RULES ---
    1.  **CHARACTER DESCRIPTION:** In your scene descriptions, refer to characters descriptively based on their appearance (e.g., "the tall man in the suit," "the young woman with glasses"). Do NOT use the real names of any recognizable people. This is the most important rule.
    2.  **SAFETY:** All descriptions must be completely safe for a general audience. Avoid depicting violence, weapons, blood, or any other sensitive content. Focus on positive or neutral actions, expressions, setting, and mood.
    --- END OF RULES ---
    
    The output must be a JSON array of ${sceneCount} strings. Each string is a detailed, single-paragraph visual prompt for an image generation AI. Describe the scene, character actions, and environment vividly. Do not include scene numbers or labels.
    
    Example output format for a 3-scene story:
    ["A determined explorer wearing a weathered leather jacket and a wise guide in traditional robes stand before a vast, ancient ruin at sunrise.", "Inside a crumbling temple, the explorer points a flashlight at a cryptic mural while the guide examines a stone tablet.", "Standing on a high ledge, the two characters look out at the panoramic jungle vista, their quest successful."]
  `;

  const imageParts = images.map(image => fileToGenerativePart(image.base64, image.file.type));
  
  const contents = { parts: [{ text: prompt }, ...imageParts] };

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            }
        }
    }
  });

  try {
    const jsonText = response.text.trim();
    const scenePrompts = JSON.parse(jsonText);
    if (Array.isArray(scenePrompts) && scenePrompts.every(p => typeof p === 'string')) {
      return scenePrompts;
    }
    throw new Error("Parsed JSON is not an array of strings.");
  } catch (error) {
    console.error("Failed to parse scenario JSON:", response.text);
    throw new Error("The AI returned an invalid story format. Please try again.");
  }
};

export const generateImageForScene = async (prompt: string, characters: CharacterImage[], aspectRatio: string): Promise<string> => {
    const characterImageParts = characters.map(image => 
        fileToGenerativePart(image.base64, image.file.type)
    );

    const characterReferenceInstructions = characters.map((char, index) => 
      `- **Character ${index + 1} (from Reference Image ${index + 1}):** This person is **EXACTLY ${char.age || 25} years old**. Your task is to recreate them with perfect fidelity at this specific age.`
    ).join('\n');

    const ageAccuracyRule = characters.map((char, index) => 
      `Character ${index + 1} must appear to be **precisely ${char.age || 25} years old**.`
    ).join(' ');

    const instructionPart = {
        text: `
          **PRIMARY GOAL:** Generate a single, photorealistic, cinematic image that places the **exact individuals** from the reference images into the new scene described below, respecting their specified ages precisely.

          --- REFERENCE CHARACTERS & AGES ---
          ${characterReferenceInstructions}
          --- END REFERENCE CHARACTERS & AGES ---

          --- ABSOLUTE RULES (NON-NEGOTIABLE) ---
          1.  **ASPECT RATIO:** The final image MUST have an aspect ratio of **${aspectRatio}**. This is a critical requirement.
          2.  **PERFECT LIKENESS - ZERO DEVIATION:** Your most critical task is to achieve a **PERFECT LIKENESS** of the people in the reference images. You are not creating a *similar* person; you are recreating the **exact same person**. Reproduce their facial features, bone structure, eyes, nose, mouth, hair, and skin tone with **ZERO DEVIATION**. The output must look like a photograph of the actual reference person.
          3.  **PRECISE AGE REPRESENTATION:** This is as important as likeness. The age for each character is **NOT an approximation**. You MUST render each character to look **exactly** their specified age. ${ageAccuracyRule}
          4.  **SEAMLESS INTEGRATION:** Do not "cut and paste". The characters must be seamlessly integrated into the scene. This means applying realistic lighting, shadows, poses, and expressions that match the scene's description. Their clothing should be adapted to fit the scene's context.
          5.  **SCENE ACCURACY:** The final image must accurately depict the environment, actions, and mood described in the "SCENE DESCRIPTION".
          --- END ABSOLUTE RULES ---
          
          --- SCENE DESCRIPTION ---
          "${prompt}"
          --- END SCENE DESCRIPTION ---
        `
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [instructionPart, ...characterImageParts],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    
    console.error("Image generation failed. API response:", response);
    throw new Error(`فشل إنشاء الصورة للموجه: "${prompt}". قد يكون السبب هو سياسات الأمان. حاول تعديل فكرة القصة.`);
};


export const generateStoryboard = async (
  images: CharacterImage[],
  userPrompt: string,
  genre: string,
  subGenre: string,
  sceneCount: number,
  aspectRatio: string,
  onProgress: (current: number, total: number) => void,
  onSceneGenerated: (scene: Scene) => void
): Promise<void> => {
  const scenePrompts = await generateScenarioText(images, userPrompt, genre, subGenre, sceneCount);
  
  const totalScenes = scenePrompts.length;

  for (let i = 0; i < totalScenes; i++) {
    onProgress(i + 1, totalScenes);
    const imageUrl = await generateImageForScene(scenePrompts[i], images, aspectRatio);
    const newScene = {
      description: scenePrompts[i],
      imageUrl: imageUrl,
    };
    onSceneGenerated(newScene);
  }
};