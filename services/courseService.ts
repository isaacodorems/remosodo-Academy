import type { Course, CourseWithProgress } from '../types';

// This is a mock service. In a real application, this would make API calls
// to a backend to fetch user-specific course data.

interface EnrolledCourse extends Course {
    syllabusLength: number;
}

const getEnrolledCoursesKey = (email: string) => `remsodo_enrolled_${email}`;
const getProgressKey = (email: string) => `remsodo_progress_${email}`;

// --- Helper Functions ---

const getEnrolledCoursesData = (email: string): Record<string, EnrolledCourse> => {
    try {
        const data = localStorage.getItem(getEnrolledCoursesKey(email));
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
};

const saveEnrolledCoursesData = (email: string, data: Record<string, EnrolledCourse>) => {
    localStorage.setItem(getEnrolledCoursesKey(email), JSON.stringify(data));
};

const getProgressData = (email: string): Record<string, string[]> => {
    try {
        const data = localStorage.getItem(getProgressKey(email));
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
};

const saveProgressData = (email: string, data: Record<string, string[]>) => {
    localStorage.setItem(getProgressKey(email), JSON.stringify(data));
};


// --- Progress and Enrollment ---

export const enrollInCourse = async (email: string, course: Course, syllabusLength: number): Promise<void> => {
    const enrolledCourses = getEnrolledCoursesData(email);
    if (!enrolledCourses[course.title]) {
        enrolledCourses[course.title] = { ...course, syllabusLength };
        saveEnrolledCoursesData(email, enrolledCourses);
    }
};

export const getEnrollmentStatus = async (email: string, courseTitle: string): Promise<boolean> => {
    const enrolledCourses = getEnrolledCoursesData(email);
    return !!enrolledCourses[courseTitle];
};

export const getCourseProgress = async (email: string, courseTitle: string): Promise<string[]> => {
    const progressData = getProgressData(email);
    return progressData[courseTitle] || [];
};

export const updateCourseProgress = async (email: string, courseTitle: string, syllabusItemTitle: string, isComplete: boolean): Promise<void> => {
    const progressData = getProgressData(email);
    const courseProgress = progressData[courseTitle] || [];

    if (isComplete && !courseProgress.includes(syllabusItemTitle)) {
        courseProgress.push(syllabusItemTitle);
    } else if (!isComplete) {
        const index = courseProgress.indexOf(syllabusItemTitle);
        if (index > -1) {
            courseProgress.splice(index, 1);
        }
    }

    progressData[courseTitle] = courseProgress;
    saveProgressData(email, progressData);
};


// --- Dashboard Functions ---

/**
 * Fetches the courses a user is currently taking but has not completed.
 * @returns A promise that resolves to an array of courses with their completion percentage.
 */
export const getInProgressCourses = async (email: string): Promise<CourseWithProgress[]> => {
    console.log("Fetching in-progress courses...");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const enrolled = getEnrolledCoursesData(email);
    const progress = getProgressData(email);
    
    const allEnrolledCourses = Object.values(enrolled);
    const inProgressCourses: CourseWithProgress[] = [];

    for (const course of allEnrolledCourses) {
        const courseProgress = progress[course.title] || [];
        const isCompleted = course.syllabusLength > 0 && courseProgress.length >= course.syllabusLength;

        if (!isCompleted) {
            const { syllabusLength, ...courseData } = course;
            const completionPercentage = syllabusLength > 0 ? (courseProgress.length / syllabusLength) * 100 : 0;
            inProgressCourses.push({
                ...courseData,
                completionPercentage,
            });
        }
    }
    return inProgressCourses;
};

/**
 * Fetches the courses a user has completed.
 * @returns A promise that resolves to an array of courses.
 */
export const getCompletedCourses = async (email: string): Promise<Course[]> => {
    console.log("Fetching completed courses...");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const enrolled = getEnrolledCoursesData(email);
    const progress = getProgressData(email);

    const allEnrolledCourses = Object.values(enrolled);

    return allEnrolledCourses
        .filter(course => {
            const courseProgress = progress[course.title] || [];
            const isCompleted = course.syllabusLength > 0 && courseProgress.length >= course.syllabusLength;
            return isCompleted;
        })
        .map(({ syllabusLength, ...course }) => course); // Strip syllabusLength before returning
};