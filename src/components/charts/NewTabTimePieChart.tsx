import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface PieDatum {
  name: string;
  value: number;
  color: string;
}

interface NewTabTimePieChartProps {
  data: PieDatum[];
  formatTimeCn: (seconds: number) => string;
}

const NewTabTimePieChart: React.FC<NewTabTimePieChartProps> = ({ data, formatTimeCn }) => (
  <ResponsiveContainer width="100%" height={180} minWidth={0}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={55}
        outerRadius={75}
        paddingAngle={4}
        dataKey="value"
        isAnimationActive={false}
      >
        {data.map((entry, index) => (
          <Cell key={index} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip formatter={(value: number) => formatTimeCn(value)} />
    </PieChart>
  </ResponsiveContainer>
);

export default NewTabTimePieChart;
