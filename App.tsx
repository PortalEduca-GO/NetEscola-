

import React, { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/StudentDashboard';
import Notification from './components/Notification';
import VideoAdminPanel from './components/VideoAdminPanel';
import { Student, VideoRecommendation, QuizDifficulty, QuizQuestion } from './types';
import { generateQuizForVideo } from './services/geminiService';
import Footer from './components/Footer';

export type View = 'home' | 'login' | 'dashboard';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
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

  const handleReportVideoIssue = useCallback((videoId: string, issueType: string) => {
    // Em produção, isso seria enviado para um sistema de analytics ou API
    const reportData = {
      videoId,
      issueType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: currentUser?.id
    };
    
    console.log('Video issue reported:', reportData);
    
    // Aqui você poderia enviar para um serviço de analytics
    // analytics.track('video_issue_reported', reportData);
    
    // Ou salvar no localStorage para análise posterior
    const existingReports = JSON.parse(localStorage.getItem('videoIssueReports') || '[]');
    existingReports.push(reportData);
    localStorage.setItem('videoIssueReports', JSON.stringify(existingReports));
  }, [currentUser]);

  useEffect(() => {
    // Mostra a notificação sobre as melhorias implementadas apenas uma vez
    const hasSeenVideoFix = localStorage.getItem('hasSeenVideoFixNotification');
    if (!hasSeenVideoFix) {
      setShowNotification(true);
      localStorage.setItem('hasSeenVideoFixNotification', 'true');
    }

    // Adiciona atalho de teclado para abrir painel administrativo (Ctrl+Shift+A)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setShowAdminPanel(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);


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
            onReportVideoIssue={handleReportVideoIssue}
          />
        );
      default:
        return <HomePage onStartAnalysis={() => handleNavigate('login')} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {showNotification && (
        <Notification
          message="✅ Melhorias implementadas: Sistema de vídeos aprimorado com validação em tempo real e detecção inteligente de problemas!"
          type="success"
          duration={8000}
          onClose={() => setShowNotification(false)}
        />
      )}
      <VideoAdminPanel 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
      />
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