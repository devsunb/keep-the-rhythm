export interface FileStats {
	id?: number;
	path: string;
	filename: string;
	wordCount: number;
	charCount?: number;
	created?: Date;
	deleted?: Date;
	lastModified: Date;
	timesOpened: number;
}

export interface DailyActivity {
	id?: number;
	date: string;
	filePath: string;
	wordCountStart: number;
	charCountStart: number;
	changes: TimeEntry[];
}

export interface TimeEntry {
	timeKey: string;
	w: number;
	c: number;
}
