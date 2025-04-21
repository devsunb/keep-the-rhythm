export class EditorStore {
  private _currentFilePath: string | null = null;
  private _lastProcessedContent: string = "";
  private _lastProcessedWordCount: number = 0;
  private _accumulatedWordsDelta: number = 0;
  private _dbUpdateTimeout: NodeJS.Timeout | null = null;

  private _listeners: Array<() => void> = [];

  // Getters
  get currentFilePath() {
    return this._currentFilePath;
  }
  get lastProcessedContent() {
    return this._lastProcessedContent;
  }
  get lastProcessedWordCount() {
    return this._lastProcessedWordCount;
  }
  get accumulatedWordsDelta() {
    return this._accumulatedWordsDelta;
  }
  get dbUpdateTimeout() {
    return this._dbUpdateTimeout;
  }

  // Setters (with notification)
  setCurrentFilePath(value: string | null) {
    this._currentFilePath = value;
    this.notifyListeners();
  }

  setLastProcessedContent(value: string) {
    this._lastProcessedContent = value;
    this.notifyListeners();
  }

  setLastProcessedWordCount(value: number) {
    this._lastProcessedWordCount = value;
    this.notifyListeners();
  }

  setAccumulatedWordsDelta(value: number) {
    this._accumulatedWordsDelta = value;
    this.notifyListeners();
  }

  setDbUpdateTimeout(value: NodeJS.Timeout | null) {
    this._dbUpdateTimeout = value;
    this.notifyListeners();
  }

  // Event subscription
  subscribe(listener: () => void) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this._listeners.forEach((listener) => listener());
  }
}

export const editorStore = new EditorStore();
