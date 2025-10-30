import React, { useState, useEffect } from 'react';
import type { QuizQuestion } from '../types';

interface QuizProps {
  questions: QuizQuestion[];
  courseTitle: string;
}

const Quiz: React.FC<QuizProps> = ({ questions, courseTitle }) => {
  const answerStorageKey = `remsodo_quizAnswers_${courseTitle}`;

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const savedAnswers = localStorage.getItem(answerStorageKey);
    try {
      return savedAnswers ? JSON.parse(savedAnswers) : {};
    } catch {
      return {};
    }
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  useEffect(() => {
    if (!submitted) {
      localStorage.setItem(answerStorageKey, JSON.stringify(answers));
    }
  }, [answers, submitted, answerStorageKey]);


  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers({
      ...answers,
      [questionIndex]: answer,
    });
  };

  const handleSubmit = () => {
    let newScore = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        newScore++;
      }
    });
    setScore(newScore);
    setSubmitted(true);
    localStorage.removeItem(answerStorageKey);
  };

  const handleRetake = () => {
      setAnswers({});
      setScore(0);
      setSubmitted(false);
      localStorage.removeItem(answerStorageKey);
  }

  const getOptionBgClass = (questionIndex: number, option: string) => {
    if (!submitted) {
        return answers[questionIndex] === option 
            ? 'bg-indigo-600 ring-2 ring-indigo-400' 
            : 'bg-slate-700 hover:bg-slate-600';
    }

    const isCorrect = option === questions[questionIndex].correctAnswer;
    const isSelected = answers[questionIndex] === option;

    if (isCorrect) return 'bg-green-500/80 ring-2 ring-green-400';
    if (isSelected && !isCorrect) return 'bg-red-500/80 ring-2 ring-red-400';
    return 'bg-slate-700 opacity-60';
  }

  if (!questions || questions.length === 0) {
    return (
        <div className="bg-slate-800 p-8 rounded-lg text-center">
            <h3 className="text-xl font-bold text-white">No Quiz Available</h3>
            <p className="text-slate-400 mt-2">A quiz for this course has not been generated yet.</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {!submitted ? (
            <div className="space-y-8">
            {questions.map((q, index) => (
                <div key={index} className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <p className="text-lg font-semibold text-white mb-4">{index + 1}. {q.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswerChange(index, option)}
                        className={`p-4 rounded-lg text-left transition-all duration-200 ${getOptionBgClass(index, option)}`}
                    >
                        {option}
                    </button>
                    ))}
                </div>
                </div>
            ))}
            <div className="text-center">
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length !== questions.length}
                    className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                    Submit Answers
                </button>
            </div>
            </div>
        ) : (
            <div className="bg-slate-800 p-8 rounded-lg text-center shadow-xl animate-fade-in">
                <h3 className="text-3xl font-extrabold text-white">Quiz Results</h3>
                <p className="mt-4 text-5xl font-bold text-indigo-400">{score} / {questions.length}</p>
                <p className="mt-2 text-lg text-slate-300">
                    {score === questions.length ? "Excellent work!" : "Good effort! Review the material and try again."}
                </p>
                <div className="mt-8">
                     <button
                        onClick={handleRetake}
                        className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                        Retake Quiz
                    </button>
                </div>

                <div className="mt-10 text-left space-y-6">
                    <h4 className="text-xl font-bold text-white">Review Answers</h4>
                    {questions.map((q, index) => (
                        <div key={index} className="bg-slate-900/50 p-4 rounded-lg">
                             <p className="text-md font-semibold text-white mb-3">{index + 1}. {q.question}</p>
                             <div className="space-y-2">
                                {q.options.map((option, i) => (
                                     <div key={i} className={`p-3 rounded-md text-sm ${getOptionBgClass(index, option)}`}>
                                        {option}
                                     </div>
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default Quiz;