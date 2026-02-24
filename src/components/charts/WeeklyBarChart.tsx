import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface WeeklyDatum {
  date: string;
  hours: number;
}

interface WeeklyBarChartProps {
  data: WeeklyDatum[];
}

const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px' }} />
      <Bar dataKey="hours" name="使用时长 (小时)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
    </BarChart>
  </ResponsiveContainer>
);

export default WeeklyBarChart;
