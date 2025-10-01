import React, { useMemo } from 'react';
import {
  Student,
  StudentActivityRecord,
  StudentVideoHistoryItem,
  VideoRecommendation,
} from '../types';
import {
  grades,
  studentActivityHistory,
  studentVideoHistory,
} from '../studentData';
import { ALL_VIDEOS, SUBJECT_NAME_MAPPING } from '../constants';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts';
import {
  VideoCameraIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from './icons';

interface StudentPerformancePanelProps {
  student: Student;
}

interface ComparisonRecord {
  subject: string;
  firstBimester: number;
  secondBimester: number;
}

type WatchedVideo = VideoRecommendation & { watchedAt: string; progress: number };
type ActivityWithPercentage = StudentActivityRecord & { percentage: number };

const videoById = new Map(ALL_VIDEOS.map((video) => [video.id, video]));

const formatDate = (isoDate: string) => {
  try {
    const localeDate = new Date(isoDate);
    if (Number.isNaN(localeDate.getTime())) {
      return 'Data indisponível';
    }
    return localeDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.warn('Não foi possível formatar data', isoDate, error);
    return 'Data indisponível';
  }
};

const buildEmailFromName = (student: Student) => {
  const normalized = student.nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
  return `${normalized || 'aluno'}.${student.matricula}@aluno.educa.go.gov.br`;
};

const StudentPerformancePanel: React.FC<StudentPerformancePanelProps> = ({ student }) => {
  const studentGrades = useMemo(
    () =>
      grades.filter(
        (grade) =>
          grade.matricula === student.matricula &&
          (grade.bimestre === 1 || grade.bimestre === 2)
      ),
    [student.matricula]
  );

  const comparisonData: ComparisonRecord[] = useMemo(() => {
    const map = new Map<string, { first?: number; second?: number }>();

    studentGrades.forEach((record) => {
      if (!map.has(record.disciplina)) {
        map.set(record.disciplina, {});
      }
      const entry = map.get(record.disciplina)!;
      if (record.bimestre === 1) {
        entry.first = record.nota * 10;
      }
      if (record.bimestre === 2) {
        entry.second = record.nota * 10;
      }
    });

    return Array.from(map.entries()).map(([subject, value]) => ({
      subject,
      firstBimester: value.first ?? 0,
      secondBimester: value.second ?? 0,
    }));
  }, [studentGrades]);

  const averageByBimester = useMemo(() => {
    if (!comparisonData.length) {
      return { first: 0, second: 0, difference: 0 };
    }

    const totals = comparisonData.reduce(
      (acc, item) => {
        acc.first += item.firstBimester;
        acc.second += item.secondBimester;
        return acc;
      },
      { first: 0, second: 0 }
    );

    const divisor = comparisonData.length || 1;
    const firstAverage = totals.first / divisor;
    const secondAverage = totals.second / divisor;

    return {
      first: firstAverage,
      second: secondAverage,
      difference: secondAverage - firstAverage,
    };
  }, [comparisonData]);

  const videosWatched = useMemo<WatchedVideo[]>(() => {
    const history: StudentVideoHistoryItem[] =
      studentVideoHistory[student.matricula] ?? [];

    const enrichedHistory = history
      .map((item) => {
        const video = videoById.get(item.videoId);
        if (!video) {
          return null;
        }
        return {
          ...video,
          watchedAt: item.watchedAt,
          progress: item.progress ?? 1,
        };
      })
      .filter(
        (
          item
        ): item is VideoRecommendation & { watchedAt: string; progress: number } =>
          item !== null
      )
      .slice(0, 5);

    if (enrichedHistory.length) {
      return enrichedHistory;
    }

    const fallbackSubjects = [...comparisonData]
      .sort((a, b) => a.secondBimester - b.secondBimester)
      .slice(0, 3);

    return fallbackSubjects
      .map((entry, index) => {
        const normalizedSubject =
          SUBJECT_NAME_MAPPING[entry.subject] ?? entry.subject;
        const matchingVideo = ALL_VIDEOS.find(
          (video) =>
            video.subject.toLowerCase() === normalizedSubject.toLowerCase() &&
            video.gradeLevel.includes(student.serie)
        ) ??
          ALL_VIDEOS.find((video) => video.gradeLevel.includes(student.serie));

        if (!matchingVideo) {
          return null;
        }

        return {
          ...matchingVideo,
          watchedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
          progress: 1,
        };
      })
      .filter((item): item is WatchedVideo => item !== null);
  }, [student.matricula, student.serie, comparisonData]);

  const activityHistory = useMemo<ActivityWithPercentage[]>(() => {
    const history: StudentActivityRecord[] =
      studentActivityHistory[student.matricula] ?? [];

    const enrichedHistory = history
      .map((activity) => ({
        ...activity,
        percentage: Math.round((activity.score / activity.total) * 100),
      }))
      .slice(0, 5);

    if (enrichedHistory.length) {
      return enrichedHistory;
    }

    return [...comparisonData]
      .sort((a, b) => b.secondBimester - a.secondBimester)
      .slice(0, 3)
      .map<ActivityWithPercentage>((entry, index) => {
        const scoreOutOfTen = Math.max(
          0,
          Math.min(10, Math.round(entry.secondBimester / 10))
        );

        return {
          id: `auto-activity-${index}-${student.matricula}`,
          title: `Avaliação de ${entry.subject}`,
          subject: SUBJECT_NAME_MAPPING[entry.subject] ?? entry.subject,
          score: scoreOutOfTen,
          total: 10,
          completedAt: new Date(
            Date.now() - (index + 1) * 36 * 60 * 60 * 1000
          ).toISOString(),
          percentage: scoreOutOfTen * 10,
        };
      });
  }, [student.matricula, comparisonData]);

  const averageDifferenceLabel = useMemo(() => {
    const diff = averageByBimester.difference;
    if (diff > 0.1) {
      return `+${diff.toFixed(1)} pontos em relação ao 1º bimestre`;
    }
    if (diff < -0.1) {
      return `${diff.toFixed(1)} pontos em relação ao 1º bimestre`;
    }
    return 'Sem variação significativa entre os bimestres';
  }, [averageByBimester]);

  const studentEmail = useMemo(() => buildEmailFromName(student), [student]);
  const avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(
    student.nome
  )}`;

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row md:items-center gap-6">
        <img
          src={avatarUrl}
          alt={`Foto do estudante ${student.nome}`}
          className="w-24 h-24 rounded-full object-cover border-4 border-brandGreen/60"
        />
        <div className="flex-1">
          <p className="text-sm text-brandGreen font-semibold mb-1">
            Bem-vindo(a) ao seu painel NetEscola+!
          </p>
          <h2 className="text-2xl font-bold text-brandDarkGray">
            {student.nome} <span className="text-sm font-normal text-gray-500">(Estudante)</span>
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <p>
              <strong>E-mail:</strong> {studentEmail}
            </p>
            <p>
              <strong>Matrícula:</strong> {student.matricula}
            </p>
            <p>
              <strong>Série:</strong> {student.serie}
            </p>
            <p>
              <strong>Turma:</strong> {student.turma} • {student.turno}
            </p>
            <p>
              <strong>Escola:</strong> {student.escola}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-brandDarkGray">
                Gráfico de Desempenho (Notas / 100)
              </h3>
              <p className="text-sm text-gray-500">
                Média 1º bimestre: {averageByBimester.first.toFixed(1)} • Média 2º bimestre:{' '}
                {averageByBimester.second.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">{averageDifferenceLabel}</p>
            </div>
            <span className="inline-flex items-center gap-2 text-brandGreen text-sm font-medium bg-brandGreen/10 px-3 py-1 rounded-full">
              <ChartBarIcon className="w-4 h-4" /> Comparativo 1º x 2º Bimestre
            </span>
          </div>

          {comparisonData.length ? (
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={comparisonData} outerRadius="80%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)} pontos`}
                  labelFormatter={(label) => `Disciplina: ${label}`}
                />
                <Radar
                  name="1º Bimestre"
                  dataKey="firstBimester"
                  stroke="#38bdf8"
                  fill="#38bdf8"
                  fillOpacity={0.35}
                />
                <Radar
                  name="2º Bimestre"
                  dataKey="secondBimester"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">
              Ainda não temos notas registradas para o 1º e 2º bimestres deste estudante.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <VideoCameraIcon className="w-5 h-5 text-brandGreen" />
              <h3 className="text-lg font-semibold text-brandDarkGray">
                Vídeos assistidos recentemente
              </h3>
            </div>
            {videosWatched.length ? (
              <ul className="space-y-4">
                {videosWatched.map((video) => (
                  <li key={`${video.id}-${video.watchedAt}`} className="flex gap-3">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-16 h-16 rounded-lg object-cover shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brandDarkGray truncate" title={video.title}>
                        {video.title}
                      </p>
                      <p className="text-xs text-gray-500">{video.subject}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(video.watchedAt)} • {Math.round((video.progress ?? 1) * 100)}% assistido
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Ainda não há histórico de vídeos assistidos para este estudante.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircleIcon className="w-5 h-5 text-brandGreen" />
              <h3 className="text-lg font-semibold text-brandDarkGray">Atividades realizadas</h3>
            </div>
            {activityHistory.length ? (
              <ul className="space-y-3">
                {activityHistory.map((activity) => (
                  <li
                    key={activity.id}
                    className="border border-gray-100 rounded-xl p-3 hover:border-brandGreen/40 transition"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-brandDarkGray">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.subject} • {formatDate(activity.completedAt)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-brandGreen">
                        {activity.score}/{activity.total} ({activity.percentage}%)
                      </span>
                    </div>
                    {activity.difficulty && (
                      <p className="text-xs text-gray-400 mt-1">
                        Dificuldade: {activity.difficulty}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhuma atividade concluída ainda para este estudante.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentPerformancePanel;
