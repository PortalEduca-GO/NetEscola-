

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
import StudentPerformancePanel from './components/StudentPerformancePanel';
import { XCircleIcon } from './components/icons';

export type View = 'home' | 'login' | 'dashboard';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [dashboardKey, setDashboardKey] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [currentQuizVideo, setCurrentQuizVideo] = useState<VideoRecommendation | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuizDifficulty, setCurrentQuizDifficulty] = useState<QuizDifficulty | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  const openProfile = useCallback(() => setIsProfileOpen(true), []);
  const closeProfile = useCallback(() => setIsProfileOpen(false), []);

  const handleNavigate = (view: View) => {
    if (view === 'dashboard' && currentView === 'dashboard') {
      setDashboardKey(prevKey => prevKey + 1);
    }
    setCurrentView(view);
    if (view !== 'dashboard') {
      closeProfile();
    }
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
  closeProfile();
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
            onCloseProfile={closeProfile}
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
        onOpenProfile={currentUser ? openProfile : undefined}
      />
      {isProfileOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeProfile}
          />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-50 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-2xl font-semibold text-brandDarkGray">Meu Perfil</h3>
                <button
                  type="button"
                  onClick={closeProfile}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-brandDarkGray hover:bg-gray-200 transition"
                  aria-label="Fechar Meu Perfil"
                >
                  <XCircleIcon className="w-5 h-5" /> Fechar
                </button>
              </div>

              {currentUser ? (
                <StudentPerformancePanel student={currentUser} />
              ) : (
                <div className="bg-white rounded-2xl shadow-md p-6 text-center space-y-3">
                  <p className="text-lg font-semibold text-brandDarkGray">Faça login para ver seu perfil</p>
                  <p className="text-sm text-gray-600">
                    Assim que você acessar sua conta, o painel de desempenho ficará disponível em qualquer tela.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <main className="flex-grow">
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};