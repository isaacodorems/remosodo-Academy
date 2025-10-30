
import React from 'react';
import type { Course } from '../types';
import StarRating from './StarRating';

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
  completionPercentage?: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect, completionPercentage }) => {
  return (
    <div 
        className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
        onClick={() => onSelect(course)}
    >
      <div className="h-36 bg-slate-700 flex items-center justify-center">
        <img src={`https://picsum.photos/seed/${course.title}/400/200`} alt={course.title} className="w-full h-full object-cover"/>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{course.category}</span>
        <h3 className="text-xl font-bold text-white mt-2 mb-2 h-14">{course.title}</h3>
        <p className="text-slate-400 text-sm flex-grow mb-4">{course.description.substring(0, 100)}...</p>
        <div className="mt-auto">
            {typeof completionPercentage === 'number' && (
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-300">Progress</span>
                        <span className="text-xs font-bold text-indigo-400">{completionPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${completionPercentage}%` }}
                        ></div>
                    </div>
                </div>
            )}
            <p className="text-sm text-slate-300 mb-2">By {course.instructor}</p>
            <div className="flex items-center justify-between text-sm">
                <StarRating rating={course.rating} />
                <span className="text-slate-400">{course.duration}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;