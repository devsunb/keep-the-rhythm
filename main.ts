import { debounce, Plugin, TFile, TAbstractFile, MarkdownView } from 'obsidian';  // Add MarkdownView to imports
import { WordCountView, VIEW_TYPE } from './views/WordCountView';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';

interface FileWordCount {
    initial: number;
    current: number;
}

interface DayData {
    totalDelta: number;
    files: {
        [filePath: string]: FileWordCount;
    };
}

interface WordCountData {
    deviceId: string;
    dailyCounts: {
        [date: string]: DayData;
    };
}

export default class WordCountPlugin extends Plugin {
	private debouncedHandleModify: (file: TFile) => void;
    private data: WordCountData;	
	private deviceId: string;

	private getDeviceId(): string {
        let deviceId = localStorage.getItem('word-count-device-id');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('word-count-device-id', deviceId);
        }
        return deviceId;
    }
	
	private getDeviceDataPath(): string {
        return `data/device-${this.getDeviceId()}.json`;
    }

	private getCurrentDate(): string {
        return new Date().toISOString().split('T')[0];  // YYYY-MM-DD
    }

	getWordCount(text: string): number {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

	private async initializeData() {
		console.log('initializing data');

		const localData = await this.loadDeviceData();
		if (localData) {
			this.data = localData;
		} else {
			console.log('creating new data structure');
			this.data = {
				deviceId: this.getDeviceId(),
				dailyCounts: {}
			};
			await this.saveDeviceData(this.data);
		}
		console.log('current data:', this.data); // Debug log
	}
	
	async activateView() {
        const { workspace } = this.app;
        if (workspace.getLeavesOfType(VIEW_TYPE).length > 0) {
            return;
        }
        await workspace.getRightLeaf(false).setViewState({
            type: VIEW_TYPE,
            active: true,
        });
    }

	async onload() {
		console.log('starting plugin')
		await this.initializeData();
		
		this.registerView(
			VIEW_TYPE,
			(leaf) => new WordCountView(leaf, this)  
		);

		this.addRibbonIcon(
            "document",
            "Word Count Stats", 
            () => {
                this.activateView();
            }
        );

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (!leaf) {
					console.log('No leaf available');
					return;
				}
				const view = leaf.view;
				if (view instanceof MarkdownView) {
					const file = view.file;
					if (file instanceof TFile) {
						this.handleFileOpen(file);
					}
				}
			})
		);

		this.debouncedHandleModify = debounce(
            (file: TFile) => this.handleFileModify(file),
            1000,
            false
        );

		this.registerEvent(
            this.app.vault.on('modify', (file: TAbstractFile) => {
                if (file instanceof TFile) {
                    this.debouncedHandleModify(file);
                }
            })
        );
		
		this.registerEvent(
			this.app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
				if (file instanceof TFile) {
					this.handleFileRename(file, oldPath);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', (file: TAbstractFile) => {
				if (file instanceof TFile) {
					this.handleFileDelete(file);
				}
			})
		);
	}

	private async handleFileRename(file: TFile, oldPath: string) {
		if (!file || file.extension !== 'md') {
			return;
		}
	
		try {
			const date = this.getCurrentDate();
			
			if (this.data.dailyCounts[date]?.files?.[oldPath]) {
				const fileData = this.data.dailyCounts[date].files[oldPath];
				
				this.data.dailyCounts[date].files[file.path] = fileData;
				delete this.data.dailyCounts[date].files[oldPath];
				
				await this.saveDeviceData(this.data);
				console.log(`File renamed from ${oldPath} to ${file.path}, updated tracking data`);
			}
		} catch (error) {
			console.error('Error in handleFileRename:', error);
		}
	}

	private async handleFileOpen(file: TFile) {
		if (!file || file.extension !== 'md') {
			return;
		}
	
		try {
			const date = this.getCurrentDate();
			const content = await this.app.vault.read(file);
			const initialWordCount = this.getWordCount(content);

			if (!this.data) {
				console.log('Data not initialized');
				return;
			}
			
			if (!this.data.dailyCounts[date]) {
				this.data.dailyCounts[date] = {
					totalDelta: 0,
					files: {}
				};
			}

			if (!this.data.dailyCounts[date].files[file.path]) {
				this.data.dailyCounts[date].files[file.path] = {
					initial: initialWordCount,
					current: initialWordCount
				};
				await this.saveDeviceData(this.data);
			}

			console.log(`File opened: ${file.path} with ${initialWordCount} words`);
		} catch (error) {
			console.error('Error in handleFileOpen:', error);
		}
	}

	async onunload() {
		console.log('onloading plugin')
	}
	
	private async saveDeviceData(data: WordCountData) {
		try {
			const pluginDir = `.obsidian/plugins/${this.manifest.id}`;
			const dataDir = `${pluginDir}/data`;
			const filePath = `${pluginDir}/${this.getDeviceDataPath()}`;
			
			const pluginDirExists = await this.app.vault.adapter.exists(pluginDir);
			if (!pluginDirExists) {
				await this.app.vault.adapter.mkdir(pluginDir);
			}
	
			const dataDirExists = await this.app.vault.adapter.exists(dataDir);
			if (!dataDirExists) {
				await this.app.vault.adapter.mkdir(dataDir);
			}
			
			await this.app.vault.adapter.write(
				filePath,
				JSON.stringify(data, null, 2)
			);
		} catch (error) {
			console.error('Error saving device data:', error);
		}
	}

	private async loadDeviceData(): Promise<WordCountData | null> {
		try {
			const path = `.obsidian/plugins/${this.manifest.id}/${this.getDeviceDataPath()}`;
			const exists = await this.app.vault.adapter.exists(path);
			
			if (exists) {
				const content = await this.app.vault.adapter.read(path);
				return JSON.parse(content);
			}
			return null;
		} catch (error) {
			console.error('Error loading device data:', error);
			return null;
		}
	}

	private async handleFileDelete(file: TFile) {
		if (!file || file.extension !== 'md') {
			return;
		}
	
		try {
			const date = this.getCurrentDate();
			
			if (this.data.dailyCounts[date]?.files?.[file.path]) {
				const fileData = this.data.dailyCounts[date].files[file.path];
				const lastWordCount = fileData.current;
				const initialWordCount = fileData.initial;
				
				const fileDelta = lastWordCount - initialWordCount;
				this.data.dailyCounts[date].totalDelta -= fileDelta;
				
				this.data.dailyCounts[date].files[file.path].current = 0;
				
				await this.saveDeviceData(this.data);
				console.log(`File ${file.path} deleted. Removed delta of ${fileDelta} from today's total`);
			}
		} catch (error) {
			console.error('Error in handleFileDelete:', error);
		}
	}

	private async handleFileModify(file: TFile) {
		if (!file || file.extension !== 'md') {
			return;
		}
		
		try {
			const date = this.getCurrentDate();

			if (!this.data.dailyCounts[date]?.files?.[file.path]) {
				await this.handleFileOpen(file);
				return;
			}

			const content = await this.app.vault.read(file);
			const currentWordCount = this.getWordCount(content);
			
			const previousCount = this.data.dailyCounts[date].files[file.path].current;
			const delta = currentWordCount - previousCount;

			this.data.dailyCounts[date].files[file.path].current = currentWordCount;
			this.data.dailyCounts[date].totalDelta += delta;

			await this.saveDeviceData(this.data);

			console.log(`File ${file.path} changed. Delta: ${delta}, Total delta today: ${this.data.dailyCounts[date].totalDelta}`);
        } catch (error) {
			console.error('Error in handleFileModify:', error);
        }
	}
}
