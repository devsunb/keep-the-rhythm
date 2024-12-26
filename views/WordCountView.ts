import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';  // Update this import
import Heatmap from '../components/Heatmap'
import { WordCountPlugin } from '../main';

export const VIEW_TYPE = "word-count-stats";

export class WordCountView extends ItemView {
	plugin: WordCountPlugin;  
	root: Root | null = null; 

	constructor(leaf: WorkspaceLeaf, plugin: WordCountPlugin) {  
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText() {
        return "Word Count Stats";
    }

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		const reactContainer = container.createEl("div");
		this.root = createRoot(reactContainer);
		this.root.render(
            React.createElement(Heatmap, { 
                data: this.plugin.data
            })
        );
	}

	async onClose() {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }
}
