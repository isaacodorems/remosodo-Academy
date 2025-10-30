import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInProgressCourses, getCompletedCourses, enrollInCourse } from '../services/courseService';
import { createCourseFromFileContent, createCourseFromVideoTopic } from '../services/geminiService';
import type { Course, CourseWithProgress } from '../types';
import LoadingSpinner from './LoadingSpinner';
import CourseCard from './CourseCard';
import DashboardControls from './DashboardControls';

interface DashboardProps {
    onBack: () => void;
    onSelectCourse: (course: Course) => void;
}

const inProgressSortOptions = [
    { value: 'progress-desc', label: 'Sort by Progress (High to Low)' },
    { value: 'progress-asc', label: 'Sort by Progress (Low to High)' },
    { value: 'title-asc', label: 'Sort by Title (A-Z)' },
    { value: 'title-desc', label: 'Sort by Title (Z-A)' },
    { value: 'category', label: 'Sort by Category' },
];

const completedSortOptions = [
    { value: 'title-asc', label: 'Sort by Title (A-Z)' },
    { value: 'title-desc', label: 'Sort by Title (Z-A)' },
    { value: 'category', label: 'Sort by Category' },
];


const Dashboard: React.FC<DashboardProps> = ({ onBack, onSelectCourse }) => {
    const { currentUser } = useAuth();
    const [inProgressCourses, setInProgressCourses] = useState<CourseWithProgress[]>([]);
    const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for filtering and sorting
    const [inProgressFilter, setInProgressFilter] = useState('');
    const [inProgressSort, setInProgressSort] = useState('progress-desc');
    const [completedFilter, setCompletedFilter] = useState('');
    const [completedSort, setCompletedSort] = useState('title-asc');

    // State for tutor tools
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
    const [activeToolTab, setActiveToolTab] = useState<'file' | 'video'>('file');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoTopic, setVideoTopic] = useState('');


    const fetchCourses = useCallback(async () => {
        if (currentUser) {
            setIsLoading(true);
            const [inProgress, completed] = await Promise.all([
                getInProgressCourses(currentUser.email),
                getCompletedCourses(currentUser.email)
            ]);
            setInProgressCourses(inProgress);
            setCompletedCourses(completed);
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);
    
    useEffect(() => {
        setGenerationError(null);
        setGenerationSuccess(null);
    }, [activeToolTab]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setGenerationError(null);
        setGenerationSuccess(null);
        setIsGenerating(true);

        try {
            if (file.size > 1024 * 1024) { // 1MB limit
                throw new Error("File is too large. Please upload a file smaller than 1MB.");
            }
            const fileContent = await file.text();
            if (!fileContent.trim()) {
                throw new Error("File is empty or could not be read.");
            }
            
            const { course, details } = await createCourseFromFileContent(fileContent);

            if (currentUser) {
                // To make the course feel like it belongs to the tutor, we'll assign their email as instructor
                const tutorCourse = { ...course, instructor: currentUser.email };
                await enrollInCourse(currentUser.email, tutorCourse, details.syllabus.length);
            }
            
            setGenerationSuccess(`Successfully created course: "${course.title}"! Refreshing list...`);
            await fetchCourses(); // Refresh the course lists

        } catch (e: any) {
            console.error("Course creation failed:", e);
            setGenerationError(e.message || "An unexpected error occurred during course creation.");
        } finally {
            setIsGenerating(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleVideoSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!videoUrl.trim() || !videoTopic.trim()) {
            setGenerationError("Please provide both a video URL and a topic description.");
            return;
        }

        setGenerationError(null);
        setGenerationSuccess(null);
        setIsGenerating(true);

        try {
            // Simple URL validation
            new URL(videoUrl);

            const { course, details } = await createCourseFromVideoTopic(videoUrl, videoTopic);

            if (currentUser) {
                const tutorCourse = { ...course, instructor: currentUser.email };
                await enrollInCourse(currentUser.email, tutorCourse, details.syllabus.length);
            }

            setGenerationSuccess(`Successfully created course: "${course.title}"! Refreshing list...`);
            setVideoUrl('');
            setVideoTopic('');
            await fetchCourses();

        } catch (e: any) {
            console.error("Course creation from video failed:", e);
            let errorMessage = "An unexpected error occurred during course creation.";
            if (e instanceof TypeError) {
                errorMessage = "Please enter a valid URL (e.g., https://www.youtube.com/watch?v=...).";
            } else {
                errorMessage = e.message || errorMessage;
            }
            setGenerationError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredAndSortedInProgress = useMemo(() => {
        return [...inProgressCourses]
            .filter(course => course.title.toLowerCase().includes(inProgressFilter.toLowerCase()))
            .sort((a, b) => {
                switch (inProgressSort) {
                    case 'progress-asc': return a.completionPercentage - b.completionPercentage;
                    case 'progress-desc': return b.completionPercentage - a.completionPercentage;
                    case 'title-asc': return a.title.localeCompare(b.title);
                    case 'title-desc': return b.title.localeCompare(a.title);
                    case 'category': return a.category.localeCompare(b.category);
                    default: return 0;
                }
            });
    }, [inProgressCourses, inProgressFilter, inProgressSort]);

    const filteredAndSortedCompleted = useMemo(() => {
        return [...completedCourses]
            .filter(course => course.title.toLowerCase().includes(completedFilter.toLowerCase()))
            .sort((a, b) => {
                switch (completedSort) {
                    case 'title-asc': return a.title.localeCompare(b.title);
                    case 'title-desc': return b.title.localeCompare(a.title);
                    case 'category': return a.category.localeCompare(b.category);
                    default: return 0;
                }
            });
    }, [completedCourses, completedFilter, completedSort]);


    if (!currentUser) {
        return (
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <p>Please log in to view your dashboard.</p>
             </div>
        )
    }

    const renderTutorTools = () => {
        const tabClass = (tabName: 'file' | 'video') => 
            `whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeToolTab === tabName
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`;

        return (
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-1">Tutor Tools</h2>
                <div className="border-b border-slate-700 mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                         <button onClick={() => setActiveToolTab('file')} className={tabClass('file')}>
                            Create from File
                        </button>
                        <button onClick={() => setActiveToolTab('video')} className={tabClass('video')}>
                            Create from Video
                        </button>
                    </nav>
                </div>
                
                <div>
                    {activeToolTab === 'file' && (
                        <div className="animate-fade-in-fast">
                            <div className="bg-slate-900/50 p-6 rounded-lg border-2 border-dashed border-slate-600 hover:border-indigo-500 transition-colors">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                    </svg>
                                    <h3 className="mt-2 text-lg font-medium text-white">Create a Course from a File</h3>
                                    <p className="mt-1 text-sm text-slate-400">
                                        Upload a syllabus or topic outline (.txt, .md) to instantly generate a new course.
                                    </p>
                                    <div className="mt-6">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept=".txt,.md,text/plain,text/markdown"
                                            className="sr-only"
                                            id="file-upload"
                                            disabled={isGenerating}
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className={`relative inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors w-40
                                                ${isGenerating
                                                    ? 'bg-slate-600 cursor-not-allowed'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                                                }`}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                                    Creating...
                                                </>
                                            ) : 'Select a File'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                     {activeToolTab === 'video' && (
                        <div className="animate-fade-in-fast">
                            <div className="text-center mb-6">
                                <svg className="mx-auto h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
                                </svg>
                                <h3 className="mt-2 text-lg font-medium text-white">Create a Course from a Video</h3>
                                <p className="mt-1 text-sm text-slate-400">
                                    Paste a video URL and describe its topic to generate a new course.
                                </p>
                            </div>
                            <form onSubmit={handleVideoSubmit} className="space-y-4 max-w-lg mx-auto">
                                <div>
                                    <label htmlFor="video-url" className="block text-sm font-medium text-slate-300">Video URL</label>
                                    <input type="url" id="video-url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required placeholder="https://www.youtube.com/watch?v=..." className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="video-topic" className="block text-sm font-medium text-slate-300">Video Topic</label>
                                    <textarea id="video-topic" value={videoTopic} onChange={(e) => setVideoTopic(e.target.value)} required rows={3} placeholder="e.g., An introduction to quantum computing for beginners." className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                                </div>
                                <div>
                                    <button type="submit" disabled={isGenerating} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Generating...
                                            </>
                                        ) : 'Generate Course'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {generationError && (
                        <p className="mt-4 text-center text-sm bg-red-900/50 text-red-300 p-3 rounded-md">{generationError}</p>
                    )}
                    {generationSuccess && (
                        <p className="mt-4 text-center text-sm bg-green-900/50 text-green-300 p-3 rounded-md">{generationSuccess}</p>
                    )}
                </div>
            </div>
        )
    };
    

    const renderInProgressSection = () => (
         <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">In-Progress Courses</h2>
            <DashboardControls
                filterTerm={inProgressFilter}
                onFilterChange={setInProgressFilter}
                sortOption={inProgressSort}
                onSortChange={setInProgressSort}
                sortOptions={inProgressSortOptions}
            />
             {isLoading ? (
                <div className="flex justify-center items-center h-24"><LoadingSpinner/></div>
            ) : filteredAndSortedInProgress.length === 0 ? (
                <p className="text-slate-400 mt-4">
                    {inProgressCourses.length > 0 ? 'No courses match your filter.' : 'You have no courses in progress. Enroll in a course or create one to get started!'}
                </p>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedInProgress.map((course) => (
                        <CourseCard 
                            key={course.title}
                            course={course} 
                            onSelect={onSelectCourse} 
                            completionPercentage={course.completionPercentage}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    const renderCompletedSection = () => (
         <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Completed Courses</h2>
             <DashboardControls
                filterTerm={completedFilter}
                onFilterChange={setCompletedFilter}
                sortOption={completedSort}
                onSortChange={setCompletedSort}
                sortOptions={completedSortOptions}
            />
            {isLoading ? (
                <div className="flex justify-center items-center h-24"><LoadingSpinner/></div>
            ) : filteredAndSortedCompleted.length === 0 ? (
                <p className="text-slate-400 mt-4">
                     {completedCourses.length > 0 ? 'No courses match your filter.' : 'You have no completed courses yet.'}
                </p>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedCompleted.map((course) => (
                        <CourseCard 
                            key={course.title}
                            course={course} 
                            onSelect={onSelectCourse} 
                        />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <button
                onClick={onBack}
                className="mb-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
            >
                 <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to Courses
            </button>
            
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-8">My Dashboard</h1>

            {/* User Info Card */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
                <h2 className="text-xl font-bold text-white">Account Information</h2>
                <div className="mt-4 space-y-2 text-slate-300">
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>Role:</strong> <span className="capitalize font-semibold bg-indigo-500/20 text-indigo-300 py-1 px-2 rounded-md">{currentUser.role}</span></p>
                </div>
            </div>

            {/* Course Sections */}
            <div className="space-y-8">
                {currentUser.role === 'tutor' && renderTutorTools()}
                {renderInProgressSection()}
                {renderCompletedSection()}
            </div>
            <style>{`
                @keyframes fade-in-fast {
                from { opacity: 0; }
                to { opacity: 1; }
                }
                .animate-fade-in-fast {
                animation: fade-in-fast 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;