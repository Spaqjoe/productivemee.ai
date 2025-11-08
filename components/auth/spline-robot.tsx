"use client";

import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';

export function SplineRobot() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100%' }}>
      <Spline
        scene="https://prod.spline.design/eU6eRuH7qcl-fpCL/scene.splinecode"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

