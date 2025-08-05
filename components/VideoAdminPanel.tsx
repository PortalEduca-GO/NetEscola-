import React, { useState, useEffect } from 'react';
import { videoValidationService } from '../services/videoValidationService';

interface VideoReport {
  videoId: string;
  issueType: string;
  timestamp: string;
  url?: string;
  userId?: string;
}

interface VideoAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoAdminPanel: React.FC<VideoAdminPanelProps> = ({ isOpen, onClose }) => {
  const [reports, setReports] = useState<VideoReport[]>([]);
  const [cacheStats, setCacheStats] = useState({ total: 0, expired: 0, valid: 0 });
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadReports();
      loadCacheStats();
    }
  }, [isOpen]);

  const loadReports = () => {
    const savedReports = JSON.parse(localStorage.getItem('videoIssueReports') || '[]');
    setReports(savedReports);
  };

  const loadCacheStats = () => {
    const stats = videoValidationService.getCacheStats();
    setCacheStats(stats);
  };

  const clearReports = () => {
    localStorage.removeItem('videoIssueReports');
    setReports([]);
  };

  const clearCache = () => {
    videoValidationService.clearCache();
    loadCacheStats();
  };

  const exportReports = () => {
    const dataStr = JSON.stringify(reports, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-reports-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.issueType === filter;
  });

  const reportsByType = reports.reduce((acc, report) => {
    acc[report.issueType] = (acc[report.issueType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Painel Administrativo - Vídeos</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Cache Statistics */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Estatísticas do Cache</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{cacheStats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{cacheStats.valid}</p>
                <p className="text-sm text-gray-600">Válidos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{cacheStats.expired}</p>
                <p className="text-sm text-gray-600">Expirados</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={clearCache}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Limpar Cache
              </button>
            </div>
          </div>

          {/* Reports Summary */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Resumo dos Relatórios ({reports.length} total)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              {Object.entries(reportsByType).map(([type, count]) => (
                <div key={type}>
                  <p className="text-xl font-bold text-yellow-600">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">Todos os tipos</option>
              <option value="unavailable">Indisponíveis</option>
              <option value="private">Privados</option>
              <option value="deleted">Removidos</option>
              <option value="network">Problemas de rede</option>
              <option value="other">Outros</option>
            </select>

            <button
              onClick={exportReports}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Exportar Relatórios
            </button>

            <button
              onClick={clearReports}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Limpar Relatórios
            </button>

            <button
              onClick={loadReports}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Atualizar
            </button>
          </div>

          {/* Reports Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b">
              Relatórios de Problemas {filter !== 'all' && `(${filter})`}
            </h3>
            
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Nenhum relatório encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID do Vídeo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo do Problema</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data/Hora</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReports.map((report, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                          {report.videoId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.issueType === 'unavailable' ? 'bg-red-100 text-red-800' :
                            report.issueType === 'private' ? 'bg-yellow-100 text-yellow-800' :
                            report.issueType === 'deleted' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {report.issueType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(report.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {report.userId || 'Anônimo'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAdminPanel;
