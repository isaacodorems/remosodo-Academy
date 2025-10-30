import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { Course, CourseDetails } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chatInstance: Chat | null = null;
let generalChatInstance: Chat | null = null;

const courseListSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        category: { type: Type.STRING },
        instructor: { type: Type.STRING },
        rating: { type: Type.NUMBER },
        duration: { type: Type.STRING },
      },
      required: ['title', 'description', 'category', 'instructor', 'rating', 'duration'],
    }
};

const courseDetailsSchema = {
  type: Type.OBJECT,
  properties: {
    learningObjectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    syllabus: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          week: { type: Type.INTEGER },
          title: { type: Type.STRING },
          topic: { type: Type.STRING },
        },
        required: ['week', 'title', 'topic'],
      },
    },
    reviews: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          rating: { type: Type.NUMBER },
          comment: { type: Type.STRING },
        },
        required: ['name', 'rating', 'comment'],
      },
    },
    youtubeVideoId: {
      type: Type.STRING,
      description: "A relevant YouTube video ID for a course lesson on this topic. For example, for a course on React, a valid ID would be 'SqcY0GlETPk'.",
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
        },
        required: ['question', 'options', 'correctAnswer'],
      },
    },
  },
  required: ['learningObjectives', 'syllabus', 'reviews', 'youtubeVideoId', 'quiz'],
};

const fullCourseSchema = {
    type: Type.OBJECT,
    properties: {
        course: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                instructor: { type: Type.STRING },
                rating: { type: Type.NUMBER },
                duration: { type: Type.STRING },
            },
            required: ['title', 'description', 'category', 'instructor', 'rating', 'duration'],
        },
        details: courseDetailsSchema,
    },
    required: ['course', 'details'],
};


export const generateInitialCourses = async (): Promise<Course[]> => {
  const prompt = `Generate a diverse list of 8 fictional, modern e-learning courses. Include topics like AI, web development, design, and marketing. Ensure the rating is a number between 3.5 and 5.0.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: courseListSchema,
    },
  });

  const parsedResponse = JSON.parse(response.text);
  return parsedResponse as Course[];
};

export const searchCourses = async (query: string): Promise<Course[]> => {
    const prompt = `Generate a list of 8 fictional e-learning courses related to "${query}". Ensure the rating is a number between 3.5 and 5.0.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: courseListSchema,
        },
    });

    const parsedResponse = JSON.parse(response.text);
    return parsedResponse as Course[];
};

export const getCourseDetails = async (courseTitle: string, courseDescription: string): Promise<CourseDetails> => {
    const prompt = `You are an expert curriculum designer for an e-learning platform. For the course titled "${courseTitle}" with the description "${courseDescription}", generate detailed information.
    - Create 5 key learning objectives.
    - Create a detailed 8-week syllabus.
    - Create 3 sample student reviews with names, ratings (number between 3 and 5), and comments.
    - Provide a single, relevant YouTube video ID for a lesson on this topic. It should be a real, embeddable video ID. For example, for a web development course, you could provide 'z-zB9F-8f_w'.
    - Create a 3-question multiple-choice quiz about the topic. Each question must have 4 options and one correct answer. The correctAnswer must be one of the strings from the options array.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: courseDetailsSchema,
        },
    });

    const parsedResponse = JSON.parse(response.text);
    return parsedResponse as CourseDetails;
};

export const createCourseFromFileContent = async (fileContent: string): Promise<{ course: Course, details: CourseDetails }> => {
    const prompt = `You are an expert curriculum designer for an e-learning platform. A tutor has provided the following syllabus outline or topic description. Based on this content, generate a complete, fictional e-learning course.
    
    1.  **Course Info:** Create a suitable title, a compelling one-paragraph description, a relevant category (e.g., "Web Development", "Data Science", "Marketing"), an instructor name for the tutor who uploaded this, a plausible duration (e.g., "6 Hours"), and a rating between 4.0 and 5.0.
    2.  **Course Details:**
        - Create 5 key learning objectives.
        - Create a detailed 8-week syllabus based on the provided content. If the content is sparse, expand on it logically.
        - Create 3 sample student reviews with names, ratings (number between 3 and 5), and positive comments.
        - Provide a single, relevant, and real YouTube video ID for a lesson on this topic.
        - Create a 3-question multiple-choice quiz about the topic. Each question must have 4 options and one correct answer string.

    Here is the content provided by the tutor:
    ---
    ${fileContent}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: fullCourseSchema,
        },
    });

    const parsedResponse = JSON.parse(response.text);
    return parsedResponse as { course: Course, details: CourseDetails };
};

export const createCourseFromVideoTopic = async (videoUrl: string, topic: string): Promise<{ course: Course, details: CourseDetails }> => {
    const prompt = `You are an expert curriculum designer for an e-learning platform. A tutor wants to create a course based on the topic of a video they've provided.
    
    The video's topic is: "${topic}".
    The video URL is: ${videoUrl}. (Do not try to access this URL, use the topic description to generate the content).

    Based on the provided topic, generate a complete, fictional e-learning course.
    
    1.  **Course Info:** Create a suitable title, a compelling one-paragraph description, a relevant category (e.g., "Web Development", "Data Science", "Marketing"), an instructor name for the tutor, a plausible duration (e.g., "6 Hours"), and a rating between 4.0 and 5.0.
    2.  **Course Details:**
        - Create 5 key learning objectives.
        - Create a detailed 8-week syllabus based on the topic.
        - Create 3 sample student reviews with names, ratings (number between 3 and 5), and positive comments.
        - Provide a single, relevant, and real YouTube video ID for a lesson on this topic. It can be a different video than the one provided, but it must be on the same topic.
        - Create a 3-question multiple-choice quiz about the topic. Each question must have 4 options and one correct answer string.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: fullCourseSchema,
        },
    });

    const parsedResponse = JSON.parse(response.text);
    return parsedResponse as { course: Course, details: CourseDetails };
};


export const startChat = (courseTitle: string) => {
    chatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a friendly and helpful teaching assistant for the course "${courseTitle}". Answer student questions clearly and concisely. Do not go off-topic.`,
        },
    });
};

export const sendChatMessage = async (message: string): Promise<string> => {
    if (!chatInstance) {
        throw new Error('Chat not initialized. Call startChat first.');
    }
    const response = await chatInstance.sendMessage({ message });
    return response.text;
};

// New functions for the general site-wide chatbot
const initializeGeneralChat = () => {
    if (!generalChatInstance) {
        generalChatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are Remi, a friendly and helpful AI chatbot for Remsodo Academy, an e-learning platform. Your goal is to assist users by answering their questions about the platform, suggesting courses, explaining topics in a simple way, and providing encouragement. Keep your responses concise and friendly.`,
            },
        });
    }
};

export const sendGeneralChatMessage = async (message: string): Promise<string> => {
    initializeGeneralChat();
    // The type assertion is safe because initializeGeneralChat ensures it's not null.
    const response = await (generalChatInstance as Chat).sendMessage({ message });
    return response.text;
};