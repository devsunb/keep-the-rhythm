export {};
// import React, { useEffect, useState, useRef } from "react";
// import { Line } from "react-chartjs-2";
// import {
// 	Chart as ChartJS,
// 	CategoryScale,
// 	LinearScale,
// 	PointElement,
// 	LineElement,
// 	Title,
// 	Tooltip,
// 	Legend,
// 	Filler, // 👈 needed for area filling
// 	Chart,
// } from "chart.js";
// import { getWordAndCharCountByTimeKey, TimeEntry } from "@/db/db";
// import { EVENTS, state } from "@/core/pluginState";

// ChartJS.register(
// 	CategoryScale,
// 	LinearScale,
// 	PointElement,
// 	LineElement,
// 	Title,
// 	Tooltip,
// 	Legend,
// 	Filler, // 👈 register filler plugin
// );

// interface Props {
// 	date: string;
// }

// const DailyActivityChart: React.FC<Props> = ({ date }) => {
// 	const [dataPoints, setDataPoints] = useState<TimeEntry[]>([]);
// 	const chartRef = useRef<Chart<"line">>(null);

// 	useEffect(() => {
// 		const fetchData = async () => {
// 			const result = await getWordAndCharCountByTimeKey(date);
// 			setDataPoints(result);
// 		};

// 		fetchData();
// 		state.on(EVENTS.REFRESH_EVERYTHING, fetchData);
// 		return () => {
// 			state.off(EVENTS.REFRESH_EVERYTHING, fetchData);
// 		};
// 	}, [date]);

// 	const chartData = {
// 		labels: dataPoints.map((entry) => entry.timeKey),
// 		datasets: [
// 			{
// 				label: "Words",
// 				data: dataPoints.map((entry) => entry.totalWords),
// 				borderColor: "rgba(57, 211, 83, 1)",
// 				fill: true,
// 				tension: 0.4,

// 				backgroundColor: (context: any) => {
// 					const chart = context.chart;
// 					const { ctx, chartArea } = chart;

// 					if (!chartArea) return null; // avoid early rendering issues

// 					const gradient = ctx.createLinearGradient(
// 						0,
// 						chartArea.top,
// 						0,
// 						chartArea.bottom,
// 					);
// 					gradient.addColorStop(0, "rgba(57, 211, 83, 0.5)");
// 					gradient.addColorStop(1, "rgba(57, 211, 83, 0)");
// 					return gradient;
// 				},
// 			},
// 		],
// 	};

// 	const options = {
// 		maintainAspectRatio: false,
// 		animation: {
// 			duration: 300,
// 		},
// 		plugins: {
// 			legend: {
// 				display: false,
// 			},
// 			tooltip: {
// 				enabled: false,
// 			},
// 		},
// 		responsive: true,
// 		scales: {
// 			y: {
// 				display: false,
// 				beginAtZero: true,
// 				ticks: {
// 					padding: 0, // reduce space between ticks and chart
// 					font: {
// 						size: 10, // smaller font
// 					},
// 				},
// 				grid: {
// 					display: false,
// 				},
// 			},
// 			x: {
// 				display: false,
// 				grid: {
// 					display: false,
// 				},
// 				ticks: {
// 					autoSkip: true,
// 					maxTicksLimit: 4,
// 					maxRotation: 0,
// 					minRotation: 0,
// 					font: {
// 						size: 10,
// 					},
// 				},
// 			},
// 		},
// 	};

// 	return (
// 		<div
// 			className="ktr-chart-container"
// 			style={{
// 				width: "100%",
// 				maxHeight: "80px",
// 			}}
// 		>
// 			<Line ref={chartRef} data={chartData} options={options} />
// 		</div>
// 	);
// };

// export default DailyActivityChart;
