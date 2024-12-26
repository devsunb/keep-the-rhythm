import React from 'react';

interface HeatmapProps {
    data: {
        dailyCounts: {
            [date: string]: {
                totalDelta: number;
            };
        };
    };
}

const Heatmap = ({ data }: HeatmapProps) => {
    const today = new Date();
    const weeksToShow = 52; 

    const getIntensityLevel = (count: number): number => {
        if (count <= 0) return 0;
        if (count < 15) return 1;
        if (count < 30) return 2;
        if (count < 50) return 3;
        return 4;
    };

    const getDateForCell = (weekIndex: number, dayIndex: number): Date => {
        const date = new Date(today);
        date.setDate(date.getDate() - ((weeksToShow - weekIndex - 1) * 7 + (6 - dayIndex)));
        return date;
    };

    const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const days = Array(7).fill(null);
    const weeks = Array(weeksToShow).fill(null);

    return (
        <div className="heatmap">
            {days.map((_, dayIndex) => (
                <div key={dayIndex} className="heatmap-row">
                    {weeks.map((_, weekIndex) => {
                        const date = getDateForCell(weekIndex, dayIndex);
                        const dateStr = formatDate(date);
                        const dayData = data.dailyCounts[dateStr];
                        const count = dayData?.totalDelta || 0;
                        const level = getIntensityLevel(count);

                        return (
                            <div 
                                key={weekIndex}
                                className={`heatmap-square level-${level}`}
                                title={`${dateStr}: ${count} words`}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Heatmap;
