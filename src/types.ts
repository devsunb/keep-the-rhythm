export interface FileWordCount {
  initial: number;
  current: number;
}

export interface IntensityConfig {
  low: number;
  medium: number;
  high: number;
}

export interface DayData {
  totalDelta: number;
  files: {
    [filePath: string]: FileWordCount;
  };
}

export interface WordCountData {
  deviceId: string;
  dailyCounts: {
    [date: string]: DayData;
  };
}
