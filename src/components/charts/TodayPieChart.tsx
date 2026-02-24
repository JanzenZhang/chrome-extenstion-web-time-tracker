import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface ChartDatum {
  name: string;
  value: number;
}

interface TodayPieChartProps {
  data: ChartDatum[];
  colors: string[];
  formatTime: (seconds: number) => string;
}

const TodayPieChart: React.FC<TodayPieChartProps> = ({ data, colors, formatTime }) => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={5}
        dataKey="value"
        isAnimationActive={false}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value: number) => formatTime(value)} />
    </PieChart>
  </ResponsiveContainer>
);

export default TodayPieChart;
