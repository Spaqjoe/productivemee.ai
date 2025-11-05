"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Mon", ToDo: 5, Pending: 3, Done: 2 },
  { name: "Tue", ToDo: 4, Pending: 4, Done: 1 },
  { name: "Wed", ToDo: 3, Pending: 2, Done: 5 },
  { name: "Thu", ToDo: 6, Pending: 1, Done: 3 },
  { name: "Fri", ToDo: 2, Pending: 5, Done: 4 },
  { name: "Sat", ToDo: 1, Pending: 2, Done: 3 },
  { name: "Sun", ToDo: 0, Pending: 1, Done: 4 },
];

const colors = {
  ToDo: "#3b82f6",
  Pending: "#f59e0b",
  Done: "#10b981",
};

export function ActivityGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Activity Overview</span>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.ToDo }}></div>
              ToDo
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.Pending }}></div>
              Pending
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.Done }}></div>
              Done
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorToDo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.ToDo} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.ToDo} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.Pending} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.Pending} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.Done} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.Done} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="Done"
              stackId="1"
              stroke={colors.Done}
              fill="url(#colorDone)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Pending"
              stackId="1"
              stroke={colors.Pending}
              fill="url(#colorPending)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="ToDo"
              stackId="1"
              stroke={colors.ToDo}
              fill="url(#colorToDo)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

