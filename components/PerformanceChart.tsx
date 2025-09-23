
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { SubjectPerformance } from '../types';

interface PerformanceChartProps {
  data: SubjectPerformance[];
}

// A palette of distinct colors for the subjects
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A239CA', 
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A1FF33',
  '#33FFF3', '#F333FF', '#FFBD33', '#33FFBD', '#BD33FF'
];

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-600 py-4">Nenhum dado de desempenho para exibir.</p>;
  }
  
  // Transform data: scale grades to 0-10
  const chartData = data.map(item => ({
    name: item.subject,
    Nota: parseFloat((item.grade / 10).toFixed(1)), // Scale to 0-10, keep one decimal place
  }));

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Format the grade to use a comma for the decimal point
      const formattedGrade = payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return (
        <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          {/* Use the subject's color in the tooltip if desired, or a standard color */}
          <p style={{ color: payload[0].payload.color || '#0088FE' }}>{`Nota: ${formattedGrade}`}</p>
        </div>
      );
    }
    return null;
  };

  const yAxisTickFormatter = (tick: number) => {
    return tick.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
      <h3 className="text-xl font-semibold text-brandDarkGray mb-6 text-center">Desempenho por Disciplina (Escala 0-10)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: 0, // Adjusted for Y-axis labels if they become wider
            bottom: 70, // Increased bottom margin for rotated labels
          }}
          barGap={10} // Space between bars of different categories
          barCategoryGap="20%" // Space between bars of the same category (if multiple bars per category)
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={80} // Allocate more height for XAxis due to rotation and longer names
            interval={0} 
            tick={{ fontSize: '0.75rem', fill: '#4A5568' }} 
            label={{ value: 'Disciplinas', position: 'insideBottom', dy: 10, fontSize: '0.85rem', fill: '#333' }}
          />
          <YAxis 
            domain={[0, 10]} // Grades are now 0-10
            allowDecimals={true}
            tickFormatter={yAxisTickFormatter} // Format Y-axis ticks with comma
            tick={{ fontSize: '0.8rem', fill: '#4A5568' }}
            label={{ value: 'Nota', angle: -90, position: 'insideLeft', dx: -5, fontSize: '0.85rem', fill: '#333' }}
            width={40} // Adjust width to accommodate formatted tick values like "10,0"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200, 200, 200, 0.2)' }} />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value, entry, index) => <span style={{ color: COLORS[index % COLORS.length] }}>{value}</span>}
          />
          <Bar dataKey="Nota" name="Nota" radius={[4, 4, 0, 0]}>
            {
              chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} // Assign a unique color per subject
                />
              ))
            }
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
