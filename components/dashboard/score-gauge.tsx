"use client";
interface ScoreGaugeProps { score: number; grade: string; size?: number; }
export function ScoreGauge({ score, grade, size = 160 }: ScoreGaugeProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? "text-success" : score >= 75 ? "text-primary" : score >= 60 ? "text-warning" : "text-destructive";
  const strokeColor = score >= 90 ? "#22c55e" : score >= 75 ? "#3b82f6" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted opacity-30" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${color}`}>{score}</span>
        <span className="text-sm text-muted-foreground font-medium">Grade {grade}</span>
      </div>
    </div>
  );
}
