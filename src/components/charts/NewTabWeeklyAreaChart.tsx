import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface WeeklyTrendDatum {
  date: string;
  prod: number;
  ent: number;
}

interface NewTabWeeklyAreaChartProps {
  data: WeeklyTrendDatum[];
}

const NewTabWeeklyAreaChart: React.FC<NewTabWeeklyAreaChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={280} minWidth={0}>
    <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
      <defs>
        <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gradEnt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
      <Tooltip
        contentStyle={{ borderRadius: '8px', fontSize: '12px', backdropFilter: 'blur(8px)' }}
        formatter={(value: number, name: string) => [
          `${value}h`,
          name === 'prod' ? '生产力' : name === 'ent' ? '娱乐' : '总计'
        ]}
      />
      <Area type="monotone" dataKey="prod" name="prod" stroke="#34d399" fill="url(#gradProd)" strokeWidth={2} />
      <Area type="monotone" dataKey="ent" name="ent" stroke="#f87171" fill="url(#gradEnt)" strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
);

export default NewTabWeeklyAreaChart;
