import React from "react";
import { WordCountData } from "../types";

export const Overview = ({ data }: { data: WordCountData }) => {
  const today = new Date();
  const getDateStr = (date: Date) => date.toISOString().split("T")[0];

  const getWordCount = (startDate: Date, endDate: Date) => {
    let total = 0;
    const start = getDateStr(startDate);
    const end = getDateStr(endDate);

    Object.entries(data.dailyCounts).forEach(([date, dayData]) => {
      if (date >= start && date <= end) {
        total += dayData.totalDelta;
      }
    });
    return total;
  };

  const todayCount = data.dailyCounts[getDateStr(today)]?.totalDelta || 0;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekCount = getWordCount(weekStart, today);

  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearCount = getWordCount(yearStart, today);

  return (
    <div className="stats-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Today</div>
          <div className="stat-value">{todayCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-value">{weekCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Year</div>
          <div className="stat-value">{yearCount}</div>
        </div>
      </div>
    </div>
  );
};
