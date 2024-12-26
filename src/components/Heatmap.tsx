import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../components/ui/tooltip";

import React from "react";
import { WordCountData, IntensityConfig } from "../types";
import { Overview } from "./Overview";

interface HeatmapProps {
  data: WordCountData;
  intensityLevels: IntensityConfig;
  showOverview?: boolean; // New optional prop
}

interface HeatmapCellProps {
  date: string;
  count: number;
  files: {
    [path: string]: {
      initial: number;
      current: number;
    };
  };
  intensityLevels: IntensityConfig;
}

const HeatmapCell = ({
  date,
  count,
  files,
  intensityLevels,
}: HeatmapCellProps) => {
  const getIntensityLevel = (count: number): number => {
    const { low, medium, high } = intensityLevels;
    if (count <= 0) return 0;
    if (count < low) return 1;
    if (count < medium) return 2;
    if (count < high) return 3;
    return 4;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`heatmap-square level-${getIntensityLevel(count)}`} />
      </TooltipTrigger>
      <TooltipContent className="custom-tooltip">
        <div className="">{new Date(date).toLocaleDateString()}</div>
        <div className="">+{count} words</div>
      </TooltipContent>
    </Tooltip>
  );
};

export const Heatmap = ({
  data,
  intensityLevels,
  showOverview = true, // Default to true for backward compatibility
}: HeatmapProps) => {
  const today = new Date();
  const weeksToShow = 52;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getDateForCell = (weekIndex: number, dayIndex: number): Date => {
    const date = new Date(today);
    date.setDate(
      date.getDate() - ((weeksToShow - weekIndex - 1) * 7 + (6 - dayIndex)),
    );
    return date;
  };

  const formatDate = (date: Date): string => date.toISOString().split("T")[0];

  const getMonthLabels = () => {
    const labels = [];
    let lastMonth = -1;

    for (let week = 0; week < weeksToShow; week++) {
      const date = getDateForCell(week, 0);
      const month = date.getMonth();
      const dayOfMonth = date.getDate();

      if (month !== lastMonth && dayOfMonth <= 7) {
        labels.push({
          month: monthNames[month],
          week: week,
        });
        lastMonth = month;
      }
    }
    return labels;
  };

  return (
    <div className="component-wrapper">
      {/* Conditionally render Overview based on showOverview prop */}
      {showOverview && <Overview data={data} />}
      <TooltipProvider>
        <div className="heatmap-wrapper">
          <div className="heatmap-container">
            <div className="week-day-labels">
              {days.map((day) => (
                <div key={day} className="week-day-label">
                  {day}
                </div>
              ))}
            </div>

            <div className="heatmap-content">
              <div className="month-labels">
                {getMonthLabels().map(({ month, week }) => (
                  <div
                    key={`${month}-${week}`}
                    className="month-label"
                    style={{ gridColumn: week + 1 }}
                  >
                    {month}
                  </div>
                ))}
              </div>

              <div className="heatmap-grid">
                {Array(7)
                  .fill(null)
                  .map((_, dayIndex) => (
                    <div key={dayIndex} className="heatmap-row">
                      {Array(weeksToShow)
                        .fill(null)
                        .map((_, weekIndex) => {
                          const date = getDateForCell(weekIndex, dayIndex);
                          const dateStr = formatDate(date);
                          const dayData = data.dailyCounts[dateStr];
                          const count = dayData?.totalDelta || 0;

                          return (
                            <HeatmapCell
                              key={weekIndex}
                              date={dateStr}
                              count={count}
                              files={dayData?.files}
                              intensityLevels={intensityLevels}
                            />
                          );
                        })}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};
