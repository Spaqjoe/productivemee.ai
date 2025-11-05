"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { MdDevices } from "react-icons/md";

export function ScreenTimeWidget() {
  const dailyLimit = 8; // hours
  const currentUsage = 4.5; // hours
  const percentage = Math.round((currentUsage / dailyLimit) * 100);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Screen Time</CardTitle>
        <div className="h-8 w-8 flex items-center justify-center">
          <MdDevices className="h-6 w-6 grayscale" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <div className="text-4xl font-bold">{currentUsage}<span className="text-lg font-normal text-muted-foreground">/{dailyLimit}h</span></div>
            <div className="text-sm text-muted-foreground">Today</div>
          </div>
          <CircularProgress value={percentage} size={80} strokeWidth={8}>
            <div className="text-center">
              <div className="text-lg font-semibold">{percentage}%</div>
            </div>
          </CircularProgress>
        </div>
      </CardContent>
    </Card>
  );
}

