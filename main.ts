import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PrettyMermaidSettings {
	enabled: boolean;
	theme: 'classic' | 'professional';
	customCss: string;
}

const DEFAULT_SETTINGS: PrettyMermaidSettings = {
	enabled: true,
	theme: 'classic',
	customCss: ''
}

export default class PrettyMermaidPlugin extends Plugin {
	settings: PrettyMermaidSettings;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new PrettyMermaidSettingTab(this.app, this));

		// Register markdown post processor to enhance Mermaid diagrams
		this.registerMarkdownPostProcessor((element, context) => {
			if (this.settings.enabled) {
				this.processMermaidDiagrams(element);
			}
		});

		console.log('Pretty Mermaid plugin loaded');
	}

	onunload() {
		// Clean up any styles we've added
		this.removePrettyMermaidStyles();
		console.log('Pretty Mermaid plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Refresh all Mermaid diagrams when settings change
		this.refreshAllMermaidDiagrams();
	}

	private processMermaidDiagrams(element: HTMLElement) {
		// Find all Mermaid diagrams in the element
		const mermaidElements = element.querySelectorAll('.mermaid');
		
		mermaidElements.forEach((mermaidEl) => {
			this.enhanceMermaidDiagram(mermaidEl as HTMLElement);
		});
	}

	private enhanceMermaidDiagram(element: HTMLElement) {
		// Add our custom class for styling
		element.addClass('pretty-mermaid-enhanced');
		
		// Apply theme-specific styling
		element.addClass(`pretty-mermaid-${this.settings.theme}`);

		// TODO: Add more enhancements in future cycles
		// - Color scheme improvements
		// - Sizing fixes
		// - Smooth transitions
	}

	private removePrettyMermaidStyles() {
		// Remove all pretty-mermaid classes from existing diagrams
		const enhancedElements = document.querySelectorAll('.pretty-mermaid-enhanced');
		enhancedElements.forEach((el) => {
			el.removeClass('pretty-mermaid-enhanced');
			el.removeClass('pretty-mermaid-classic');
			el.removeClass('pretty-mermaid-professional');
		});
	}

	private refreshAllMermaidDiagrams() {
		// Remove old styling
		this.removePrettyMermaidStyles();
		
		// Re-apply styling to all current Mermaid diagrams
		const allMermaidElements = document.querySelectorAll('.mermaid');
		allMermaidElements.forEach((mermaidEl) => {
			if (this.settings.enabled) {
				this.enhanceMermaidDiagram(mermaidEl as HTMLElement);
			}
		});
	}
}

class PrettyMermaidSettingTab extends PluginSettingTab {
	plugin: PrettyMermaidPlugin;

	constructor(app: App, plugin: PrettyMermaidPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Pretty Mermaid Settings' });

		new Setting(containerEl)
			.setName('Enable Pretty Mermaid')
			.setDesc('Enable or disable Pretty Mermaid enhancements')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabled)
				.onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Theme')
			.setDesc('Select the styling theme for your Mermaid diagrams')
			.addDropdown(dropdown => dropdown
				.addOption('classic', 'Classic')
				.addOption('professional', 'Professional')
				.setValue(this.plugin.settings.theme)
				.onChange(async (value) => {
					this.plugin.settings.theme = value as PrettyMermaidSettings['theme'];
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom CSS')
			.setDesc('Add custom CSS for additional styling (advanced users)')
			.addTextArea(text => text
				.setPlaceholder('Enter custom CSS...')
				.setValue(this.plugin.settings.customCss)
				.onChange(async (value) => {
					this.plugin.settings.customCss = value;
					await this.plugin.saveSettings();
				}));
	}
}