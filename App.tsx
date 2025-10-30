import React, { useState, useEffect, useCallback } from 'react';
import type { Course, CourseDetails } from './types';
import { generateInitialCourses, searchCourses, getCourseDetails } from './services/geminiService';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import CourseCard from './components/CourseCard';
import LoadingSpinner from './components/LoadingSpinner';
import CourseDetailView from './components/CourseDetailView';
import Dashboard from './components/Dashboard';
import Hero from './components/Hero';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';

type View = 'home' | 'dashboard';

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pendingCourse, setPendingCourse] = useState<Course | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');

  const { currentUser, openAuthModal } = useAuth();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const initialCourses = await generateInitialCourses();
      setCourses(initialCourses);
    } catch (e) {
      console.error(e);
      setError('Failed to load initial courses. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectCourse = useCallback(async (course: Course, bypassAuthCheck = false) => {
    if (!currentUser && !bypassAuthCheck) {
      setPendingCourse(course);
      openAuthModal('login');
      return;
    }

    localStorage.setItem('remsodo_currentCourse', JSON.stringify(course));
    setSelectedCourse(course);
    setCurrentView('home'); // Ensure we are on the home view when a course is selected
    setIsDetailLoading(true);
    setError(null);
    try {
      const details = await getCourseDetails(course.title, course.description);
      setCourseDetails(details);
    } catch (e) {
      console.error(e);
      setError('Failed to load course details. Please go back and try again.');
    } finally {
      setIsDetailLoading(false);
    }
  }, [currentUser, openAuthModal]);
  
  // Effect to handle navigation after login
  useEffect(() => {
    if (currentUser && pendingCourse) {
      handleSelectCourse(pendingCourse, true);
      setPendingCourse(null);
    }
  }, [currentUser, pendingCourse, handleSelectCourse]);

  // Effect for initial load and persistence
  useEffect(() => {
    const savedCourseJSON = localStorage.getItem('remsodo_currentCourse');
    if (savedCourseJSON && currentUser) { // Only load saved course if logged in
      try {
        const savedCourse: Course = JSON.parse(savedCourseJSON);
        handleSelectCourse(savedCourse, true);
      } catch (e) {
        console.error("Failed to parse saved course, clearing.", e)
        localStorage.removeItem('remsodo_currentCourse');
      }
    }
    fetchInitialData();
  }, [fetchInitialData, currentUser]); // Rerun on login/logout

  const handleSearch = async (query: string) => {
    if (!query) {
      fetchInitialData();
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchTerm(query);
    try {
      const searchedCourses = await searchCourses(query);
      setCourses(searchedCourses);
    } catch (e) {
      console.error(e);
      setError(`Failed to search for "${query}". Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    localStorage.removeItem('remsodo_currentCourse');
    setSelectedCourse(null);
    setCourseDetails(null);
    setSearchTerm(''); 
    setCurrentView('home');
    if(courses.length === 0) fetchInitialData();
  };

  const navigateToDashboard = () => {
    if (currentUser) {
      setSelectedCourse(null);
      setCourseDetails(null);
      setCurrentView('dashboard');
    }
  }

  const renderContent = () => {
    if (currentView === 'dashboard' && currentUser) {
      return <Dashboard onBack={handleBackToHome} onSelectCourse={handleSelectCourse} />;
    }

    if (selectedCourse && currentUser) {
      return (
        <CourseDetailView
          course={selectedCourse}
          details={courseDetails}
          isLoading={isDetailLoading}
          onBack={handleBackToHome}
          error={error}
        />
      );
    }

    return (
      <>
        <Hero onSearch={handleSearch} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-6">
                {searchTerm ? `Results for "${searchTerm}"` : 'Featured Courses'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {courses.map((course, index) => (
                  <CourseCard key={`${course.title}-${index}`} course={course} onSelect={handleSelectCourse} />
                ))}
              </div>
            </>
          )}
        </main>
      </>
    );
  };
  
  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 font-sans">
      <Header onHomeClick={handleBackToHome} onDashboardClick={navigateToDashboard} />
      <AuthModal />
      {renderContent()}
      <Footer />
      {currentUser && <Chatbot />}
    </div>
  );
};

export default App;