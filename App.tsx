

import React, { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/StudentDashboard';
import { Student, VideoRecommendation, QuizDifficulty, QuizQuestion } from './types';
import { generateQuizForVideo } from './services/geminiService';
import Footer from './components/Footer';

export type View = 'home' | 'login' | 'dashboard';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  
  const [dashboardKey, setDashboardKey] = useState(0);

  const [currentQuizVideo, setCurrentQuizVideo] = useState<VideoRecommendation | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuizDifficulty, setCurrentQuizDifficulty] = useState<QuizDifficulty | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  const handleNavigate = (view: View) => {
    if (view === 'dashboard' && currentView === 'dashboard') {
      setDashboardKey(prevKey => prevKey + 1);
    }
    setCurrentView(view);
    window.scrollTo(0, 0); 
  };
  
  const handleLogin = (student: Student) => {
    setCurrentUser(student);
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentQuiz(null);
    setCurrentQuizVideo(null);
    handleNavigate('home');
  };

  const handleSelectVideoForQuiz = useCallback(async (video: VideoRecommendation, difficulty: QuizDifficulty) => {
    if (!video) return;
    
    if (video.id !== currentQuizVideo?.id || difficulty !== currentQuizDifficulty) {
        setCurrentQuiz(null);
    }
    
    setCurrentQuizVideo(video);
    setCurrentQuizDifficulty(difficulty);
    setIsQuizLoading(true);
    setCurrentQuiz(null); 

    const quizQuestions = await generateQuizForVideo(video.title, video.subject, difficulty);
    setCurrentQuiz(quizQuestions);
    setIsQuizLoading(false);
  }, [currentQuizVideo, currentQuizDifficulty]);


  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onStartAnalysis={() => handleNavigate('login')} />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLogin} onBack={() => handleNavigate('home')} />;
      case 'dashboard':
        if (!currentUser) {
            // Should not happen if logic is correct, but as a fallback
            return <LoginPage onLoginSuccess={handleLogin} onBack={() => handleNavigate('home')} />;
        }
        return (
          <StudentDashboard
            key={dashboardKey}
            student={currentUser}
            onSelectVideoForQuiz={handleSelectVideoForQuiz}
            currentQuiz={currentQuiz}
            currentQuizVideo={currentQuizVideo}
            currentQuizDifficulty={currentQuizDifficulty}
            isQuizLoading={isQuizLoading}
          />
        );
      default:
        return <HomePage onStartAnalysis={() => handleNavigate('login')} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};