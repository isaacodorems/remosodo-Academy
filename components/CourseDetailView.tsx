import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Course, CourseDetails } from '../types';
import LoadingSpinner from './LoadingSpinner';
import StarRating from './StarRating';
import LearningAssistant from './LearningAssistant';
import Quiz from './Quiz';
import { useAuth } from '../context/AuthContext';
import { getEnrollmentStatus, getCourseProgress, updateCourseProgress, enrollInCourse } from '../services/courseService';

interface CourseDetailViewProps {
  course: Course;
  details: CourseDetails | null;
  isLoading: boolean;
  onBack: () => void;
  error: string | null;
}

type Tab = 'syllabus' | 'reviews' | 'quiz' | 'assistant';

const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course, details, isLoading, onBack, error }) => {
  const tabStorageKey = `remsodo_activeTab_${course.title}`;
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (localStorage.getItem(tabStorageKey) as Tab) || 'syllabus';
  });

  const { currentUser } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  // Refs and state for custom YouTube player
  const playerRef = useRef<any>(null); // To hold the YT.Player instance
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);


  useEffect(() => {
    const checkEnrollmentAndProgress = async () => {
      if (currentUser && details) {
        const enrolled = await getEnrollmentStatus(currentUser.email, course.title);
        setIsEnrolled(enrolled);
        if (enrolled) {
          const userProgress = await getCourseProgress(currentUser.email, course.title);
          setProgress(userProgress);
        }
      }
    };
    checkEnrollmentAndProgress();
  }, [currentUser, course.title, details]);
  
  // Effect to check for PiP support and manage listeners
  useEffect(() => {
    setIsPipSupported(document.pictureInPictureEnabled);

    const onPipEnter = () => setIsPipActive(true);
    const onPipLeave = () => setIsPipActive(false);

    document.addEventListener('enterpictureinpicture', onPipEnter);
    document.addEventListener('leavepictureinpicture', onPipLeave);

    // Initial check in case a video from this page is already in PiP
    if (document.pictureInPictureElement) {
        setIsPipActive(true);
    }
    
    // Fullscreen listener
    const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    return () => {
        document.removeEventListener('enterpictureinpicture', onPipEnter);
        document.removeEventListener('leavepictureinpicture', onPipLeave);
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        document.removeEventListener('mozfullscreenchange', onFullscreenChange);
        document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

  const onPlayerError = (event: any) => {
    console.error("YouTube Player Error:", event.data);
    setVideoError(true);
  };
  
  // Effect for custom YouTube player initialization
  useEffect(() => {
    setVideoError(false); // Reset error on new video ID
    
    const createPlayer = () => {
      if (playerContainerRef.current && details?.youtubeVideoId && !playerRef.current) {
        playerRef.current = new (window as any).YT.Player(playerContainerRef.current.id, {
          videoId: details.youtubeVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            fs: 0, // Disable default fullscreen, we use our own
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError,
          },
        });
      }
    };

    const onPlayerReady = (event: any) => {
      setDuration(event.target.getDuration());
      event.target.setVolume(volume);
    };

    const onPlayerStateChange = (event: any) => {
      setIsPlaying(event.data === (window as any).YT.PlayerState.PLAYING);
    };
    
    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [details?.youtubeVideoId, volume]);

  // Effect for updating the video progress
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = window.setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      }, 500);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying]);


  useEffect(() => {
    localStorage.setItem(tabStorageKey, activeTab);
  }, [activeTab, tabStorageKey]);

  const handleEnroll = async () => {
    if (currentUser && details) {
      await enrollInCourse(currentUser.email, course, details.syllabus.length);
      setIsEnrolled(true);
    }
  };

  const handleToggleProgress = async (syllabusItemTitle: string) => {
    if (!currentUser || !isEnrolled) return;
    const isCurrentlyComplete = progress.includes(syllabusItemTitle);
    await updateCourseProgress(currentUser.email, course.title, syllabusItemTitle, !isCurrentlyComplete);
    
    if (isCurrentlyComplete) {
      setProgress(prev => prev.filter(item => item !== syllabusItemTitle));
    } else {
      setProgress(prev => [...prev, syllabusItemTitle]);
    }
  };
  
  const completionPercentage = useMemo(() => {
    if (!details || details.syllabus.length === 0) return 0;
    return (progress.length / details.syllabus.length) * 100;
  }, [progress, details]);

  // --- Custom Player Handlers ---
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (playerRef.current) {
      const newTime = parseFloat(e.target.value);
      setCurrentTime(newTime);
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (playerRef.current) {
      const newVolume = parseInt(e.target.value, 10);
      setVolume(newVolume);
      playerRef.current.setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        playerRef.current.unMute();
      }
    }
  };

  const handleMuteToggle = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };
  
  const handleTogglePip = async () => {
    if (!isPipSupported) return;
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else {
            const iframe = playerRef.current?.getIframe();
            if (!iframe) {
                console.error("YouTube player iframe not found.");
                return;
            }
            // This is a best-effort attempt. It may fail due to browser security restrictions on cross-origin iframes.
            const videoElement = iframe.contentDocument?.querySelector('video');
            if (videoElement) {
                await videoElement.requestPictureInPicture();
            } else {
                alert("Picture-in-Picture could not be activated automatically. Your browser may be blocking this for security reasons.\n\nTip: Try right-clicking the video and selecting 'Picture in picture' from the menu.");
                console.warn("Could not find video element inside the iframe to request Picture-in-Picture.");
            }
        }
    } catch (error) {
        alert("Picture-in-Picture failed. This can happen due to browser security policies.\n\nTip: Try right-clicking the video and selecting 'Picture in picture' from the menu.");
        console.error("Error toggling Picture-in-Picture:", error);
    }
  };

    const handleFullscreen = () => {
        if (!videoWrapperRef.current) return;
        
        const element = videoWrapperRef.current as any;
        
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) { // Firefox
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) { // Chrome, Safari and Opera
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { // IE/Edge
                element.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).mozCancelFullScreen) { // Firefox
                (document as any).mozCancelFullScreen();
            } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari and Opera
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) { // IE/Edge
                (document as any).msExitFullscreen();
            }
        }
    };

  const renderTabContent = () => {
    if (!details) return null;
    switch (activeTab) {
      case 'syllabus':
        return (
          <div className="space-y-4 animate-fade-in-slow">
            {details.syllabus.map(item => {
              const isComplete = progress.includes(item.title);
              return (
                <div key={item.week} className={`bg-slate-800 p-4 rounded-lg flex items-center transition-all duration-300 ${isComplete ? 'opacity-60' : ''}`}>
                  {isEnrolled && (
                    <input
                      type="checkbox"
                      checked={isComplete}
                      onChange={() => handleToggleProgress(item.title)}
                      className="h-6 w-6 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-700 mr-4 cursor-pointer"
                    />
                  )}
                  <div className="flex-grow">
                    <p className={`font-bold text-indigo-400 ${isComplete ? 'line-through' : ''}`}>Week {item.week}: {item.title}</p>
                    <p className={`text-slate-300 mt-1 ${isComplete ? 'line-through' : ''}`}>{item.topic}</p>
                  </div>
                </div>
              )
            })}
          </div>
        );
      case 'reviews':
        return (
          <div className="space-y-6 animate-fade-in-slow">
            {details.reviews.map((review, i) => (
                <div key={i} className="bg-slate-800 p-6 rounded-lg">
                    <div className="flex items-center mb-2">
                        <StarRating rating={review.rating} />
                        <p className="ml-4 font-bold text-white">{review.name}</p>
                    </div>
                    <p className="text-slate-300 italic">"{review.comment}"</p>
                </div>
            ))}
          </div>
        );
      case 'quiz':
        return <div className="animate-fade-in-slow"><Quiz questions={details.quiz} courseTitle={course.title} /></div>;
      case 'assistant':
        return <div className="animate-fade-in-slow"><LearningAssistant courseTitle={course.title} /></div>;
      default:
        return null;
    }
  };
  
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

      <div className="bg-slate-800 p-8 rounded-lg shadow-xl mb-8">
          <p className="text-indigo-400 font-semibold uppercase">{course.category}</p>
          <h1 className="text-4xl font-extrabold text-white mt-2">{course.title}</h1>
          <p className="text-slate-300 mt-4 text-lg">{course.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-300">
              <StarRating rating={course.rating} large={true} />
              <span>Taught by <span className="font-bold text-white">{course.instructor}</span></span>
              <span>Duration: <span className="font-bold text-white">{course.duration}</span></span>
          </div>
           {!isEnrolled && details && (
              <div className="mt-8">
                <button 
                  onClick={handleEnroll}
                  className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-500 transition-colors text-lg"
                >
                  Start Course
                </button>
              </div>
            )}
      </div>

      {isEnrolled && details && (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-white">Your Progress</h3>
            <span className="text-lg font-semibold text-indigo-400">{completionPercentage.toFixed(0)}% Complete</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4">
            <div 
              className="bg-indigo-600 h-4 rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {isLoading && <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>}
      {error && !isLoading && <div className="mt-8 text-center text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</div>}
      
      {details && !isLoading && (
        <div>
          <div ref={videoWrapperRef} className="mb-8 aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative group">
              <div id="youtube-player-container" ref={playerContainerRef} className="w-full h-full"></div>
              {videoError && (
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-4">
                      <svg className="w-16 h-16 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-2xl font-bold text-white">Video Unavailable</h3>
                      <p className="text-slate-400 mt-2">
                          This video could not be loaded, either because it has been removed or the owner has restricted embedding.
                      </p>
                  </div>
              )}
              {duration > 0 && !videoError && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-slate-500/50 rounded-lg appearance-none cursor-pointer range-sm accent-indigo-500 absolute top-0 left-0 right-0"
                    />
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button onClick={handlePlayPause} className="hover:text-indigo-400 transition-colors">
                                {isPlaying ? (
                                    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                ) : (
                                    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                )}
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={handleMuteToggle} className="hover:text-indigo-400 transition-colors">
                                    {isMuted || volume === 0 ? (
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a1 1 0 00-2 0v12a1 1 0 102 0V4zM10 4a1 1 0 10-2 0v12a1 1 0 102 0V4zM3 4a1 1 0 10-2 0v12a1 1 0 102 0V4z" transform="translate(3 0)" /><path d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" transform="translate(-4 0)" fill-rule="evenodd" clip-rule="evenodd"/></svg>
                                    )}
                                </button>
                                <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-16 sm:w-24 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer range-sm accent-indigo-500"/>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                             {isPipSupported && (
                                <button onClick={handleTogglePip} className={`hover:text-indigo-400 transition-colors ${isPipActive ? 'text-indigo-400' : ''}`} title={isPipActive ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}>
                                    {isPipActive 
                                        ? <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h8V8h-8v8zm0-10.5V3.5a2.5 2.5 0 00-5 0V5.5" /></svg>
                                        : <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 15a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" /></svg>
                                    }
                                </button>
                             )}
                            <button onClick={handleFullscreen} className="hover:text-indigo-400 transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                                {isFullscreen ? (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 15.75l-4.5-4.5m0 0l-4.5 4.5m4.5-4.5V21m0 0v-4.5m0 4.5h-4.5m4.5 0h4.5M8.25 8.25l4.5 4.5m0 0l4.5-4.5m-4.5 4.5V3m0 0v4.5m0-4.5h-4.5m4.5 0h4.5" /></svg>
                                ) : (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"></path></svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
              )}
          </div>
          
          <div className="mb-12 bg-slate-800 p-8 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">What you'll learn</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {details.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-400 mr-3 mt-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-b border-slate-700 mb-8">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button onClick={() => setActiveTab('syllabus')} className={`${activeTab === 'syllabus' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}>Syllabus</button>
                  <button onClick={() => setActiveTab('reviews')} className={`${activeTab === 'reviews' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}>Reviews</button>
                  <button onClick={() => setActiveTab('quiz')} className={`${activeTab === 'quiz' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}>Quiz</button>
                  <button onClick={() => setActiveTab('assistant')} className={`${activeTab === 'assistant' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}>Assistant</button>
              </nav>
          </div>
          
          <div>{renderTabContent()}</div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailView;

const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
}
@keyframes fade-in-slow {
    from { opacity: 0; }
    to { opacity: 1; }
}
.animate-fade-in-slow {
    animation: fade-in-slow 0.5s ease-out forwards;
}

/* Custom Range Input Styles */
input[type="range"].range-sm {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: transparent; /* Track is part of parent div */
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
}

input[type="range"].range-sm:hover {
  opacity: 1;
}

input[type="range"].range-sm::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #fff;
  cursor: pointer;
  border-radius: 50%;
}

input[type="range"].range-sm::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #fff;
  cursor: pointer;
  border-radius: 50%;
  border: none;
}
`;
document.head.appendChild(style);