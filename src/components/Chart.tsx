import React, { useEffect, useRef } from "react";
import {
	Chart,
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
	Legend,
} from "chart.js";

Chart.register(
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
	Legend,
);

interface HeatmapProps {
	intensityLevels: number[];
}

export const CustomChart = ({ intensityLevels }: HeatmapProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartRef = useRef<Chart | null>(null);

	useEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) return;

		if (chartRef.current) {
			chartRef.current.destroy();
		}

		chartRef.current = new Chart(ctx, {
			type: "line",
			data: {
				labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
				datasets: [
					{
						label: "Writing Intensity",
						data: intensityLevels,
						borderColor: "white",
						backgroundColor: "rgba(59, 130, 246, 0.4)",
						tension: 0.5,
						pointRadius: 4,
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: { display: false },
				},
				scales: {
					y: {
						beginAtZero: true,
					},
				},
			},
		});
	}, [intensityLevels]);

	return <canvas ref={canvasRef} />;
};
