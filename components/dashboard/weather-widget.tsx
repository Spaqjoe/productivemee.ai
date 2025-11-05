"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch("/api/weather?lat=40.7128&lon=-74.0060");
        const data = await response.json();
        setWeather(data);
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Weather</CardTitle>
        <div className="h-8 w-8 flex items-center justify-center">
          <span className="text-2xl grayscale">☀️</span>
        </div>
      </CardHeader>
      <CardContent>
        {weather ? (
          <div className="space-y-1">
            <div className="text-4xl font-bold">{weather.temperature}°C</div>
            <div className="text-sm text-muted-foreground">{weather.description}</div>
            <div className="text-xs text-muted-foreground">
              Feels like {weather.feels_like}°C
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Weather data unavailable</div>
        )}
      </CardContent>
    </Card>
  );
}

