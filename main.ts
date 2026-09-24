import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PrettyMermaidSettings {
	enabled: boolean;
	theme: 'classic' | 'monochrome';
	colorMode: 'auto' | 'light' | 'dark';
	customCss: string;
}

const DEFAULT_SETTINGS: PrettyMermaidSettings = {
	enabled: true,
	theme: 'classic',
	colorMode: 'auto',
	customCss: ''
}

export default class PrettyMermaidPlugin extends Plugin {
	settings: PrettyMermaidSettings;
	private mutationObserver: MutationObserver | null = null;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new PrettyMermaidSettingTab(this.app, this));

		// Register markdown post processor to enhance Mermaid diagrams
		this.registerMarkdownPostProcessor((element, context) => {
			if (this.settings.enabled) {
				this.processMermaidDiagrams(element);
				// Also retry after a delay to catch async-rendered diagrams
				setTimeout(() => {
					this.processMermaidDiagrams(element);
				}, 100);
			}
		});

		// Listen for active leaf changes (when switching files)
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				if (this.settings.enabled) {
					// Give Mermaid time to render then apply styling
					setTimeout(() => {
						this.refreshAllMermaidDiagrams();
					}, 200);
				}
			})
		);

		// Set up DOM mutation observer to catch re-rendered diagrams
		this.setupMutationObserver();

		console.log('Pretty Mermaid plugin loaded');
	}

	onunload() {
		// Clean up any styles we've added
		this.removePrettyMermaidStyles();
		
		// Disconnect mutation observer
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
			this.mutationObserver = null;
		}
		
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
		// Skip if already enhanced to avoid duplicate styling
		if (element.hasClass('pretty-mermaid-enhanced')) {
			return;
		}

		// Add our custom class for styling
		element.addClass('pretty-mermaid-enhanced');
		
		// Apply theme-specific styling
		element.addClass(`pretty-mermaid-${this.settings.theme}`);
		
		// Apply Mermaid theme variables by injecting CSS
		this.applyMermaidTheme(element);
	}

	private applyMermaidTheme(element: HTMLElement) {
		// Get the theme variables based on current theme
		const themeVars = this.getMermaidThemeVariables();
		
		// Create or update a style element for this diagram
		const styleId = `pretty-mermaid-theme-${this.settings.theme}`;
		let styleElement = document.getElementById(styleId);
		
		if (!styleElement) {
			styleElement = document.createElement('style');
			styleElement.id = styleId;
			document.head.appendChild(styleElement);
		}
		
		// Generate CSS with theme variables
		const css = this.generateThemeCss(themeVars);
		styleElement.textContent = css;
	}

	private getMermaidThemeVariables() {
		if (this.settings.theme === 'classic') {
			return {
				primaryColor: '#ECECFF',
				primaryTextColor: '#333333',
				primaryBorderColor: '#9370DB',
				lineColor: '#333333',
				sectionBkgColor: '#ffffde',
				altSectionBkgColor: '#ffffde',
				gridColor: '#e0e0e0',
				secondaryColor: '#ffffde',
				tertiaryColor: '#f9f9f9',
				background: '#ffffff',
				mainBkg: '#ECECFF',
				secondBkg: '#ffffde',
				tertiaryBkg: '#f9f9f9',
				clusterBkg: '#ffffde',
				clusterBorder: '#aaaa33',
				defaultLinkColor: '#333333',
				titleColor: '#333333',
				edgeLabelBackground: '#e8e8e8',
				actorBorder: '#9370DB',
				actorBkg: '#ECECFF',
				actorTextColor: '#333333',
				actorLineColor: '#333333',
				signalColor: '#333333',
				signalTextColor: '#333333',
				c0: '#ECECFF',
				c1: '#ffffde',
				c2: '#f9f9f9',
				c3: '#e0e0e0',
				c4: '#cccccc',
				c5: '#b0b0b0',
				c6: '#999999',
				c7: '#808080'
			};
		} else {
			// Monochrome theme
			return {
				primaryColor: '#ffffff',
				primaryTextColor: '#374151',
				primaryBorderColor: '#6b7280',
				lineColor: '#9ca3af',
				sectionBkgColor: '#f3f4f6',
				altSectionBkgColor: '#f3f4f6',
				gridColor: '#e5e7eb',
				secondaryColor: '#f3f4f6',
				tertiaryColor: '#f9fafb',
				background: '#f9fafb',
				mainBkg: '#ffffff',
				secondBkg: '#f3f4f6',
				tertiaryBkg: '#f9fafb',
				clusterBkg: '#f3f4f6',
				clusterBorder: '#6b7280',
				defaultLinkColor: '#9ca3af',
				titleColor: '#374151',
				edgeLabelBackground: '#ffffff',
				actorBorder: '#6b7280',
				actorBkg: '#ffffff',
				actorTextColor: '#374151',
				actorLineColor: '#9ca3af',
				signalColor: '#9ca3af',
				signalTextColor: '#374151',
				c0: '#ffffff',
				c1: '#f3f4f6',
				c2: '#f9fafb',
				c3: '#e5e7eb',
				c4: '#d1d5db',
				c5: '#9ca3af',
				c6: '#6b7280',
				c7: '#374151'
			};
		}
	}

	private generateThemeCss(themeVars: any): string {
		const className = `pretty-mermaid-${this.settings.theme}`;
		
		return `
			.${className} {
				--mermaid-primary-color: ${themeVars.primaryColor};
				--mermaid-primary-text-color: ${themeVars.primaryTextColor};
				--mermaid-primary-border-color: ${themeVars.primaryBorderColor};
				--mermaid-line-color: ${themeVars.lineColor};
				--mermaid-section-bkg-color: ${themeVars.sectionBkgColor};
				--mermaid-alt-section-bkg-color: ${themeVars.altSectionBkgColor};
				--mermaid-grid-color: ${themeVars.gridColor};
				--mermaid-secondary-color: ${themeVars.secondaryColor};
				--mermaid-tertiary-color: ${themeVars.tertiaryColor};
				--mermaid-background: ${themeVars.background};
				--mermaid-main-bkg: ${themeVars.mainBkg};
				--mermaid-second-bkg: ${themeVars.secondBkg};
				--mermaid-tertiary-bkg: ${themeVars.tertiaryBkg};
				--mermaid-cluster-bkg: ${themeVars.clusterBkg};
				--mermaid-cluster-border: ${themeVars.clusterBorder};
				--mermaid-default-link-color: ${themeVars.defaultLinkColor};
				--mermaid-title-color: ${themeVars.titleColor};
				--mermaid-edge-label-background: ${themeVars.edgeLabelBackground};
				--mermaid-actor-border: ${themeVars.actorBorder};
				--mermaid-actor-bkg: ${themeVars.actorBkg};
				--mermaid-actor-text-color: ${themeVars.actorTextColor};
				--mermaid-actor-line-color: ${themeVars.actorLineColor};
				--mermaid-signal-color: ${themeVars.signalColor};
				--mermaid-signal-text-color: ${themeVars.signalTextColor};
				--mermaid-c0: ${themeVars.c0};
				--mermaid-c1: ${themeVars.c1};
				--mermaid-c2: ${themeVars.c2};
				--mermaid-c3: ${themeVars.c3};
				--mermaid-c4: ${themeVars.c4};
				--mermaid-c5: ${themeVars.c5};
				--mermaid-c6: ${themeVars.c6};
				--mermaid-c7: ${themeVars.c7};
			}
			
			/* Apply theme variables to SVG elements */
			.${className} .cluster rect {
				fill: var(--mermaid-cluster-bkg) !important;
				stroke: var(--mermaid-cluster-border) !important;
				stroke-width: 2px !important;
			}
			
			.${className} .node rect,
			.${className} .node circle,
			.${className} .node ellipse,
			.${className} .node polygon {
				fill: var(--mermaid-primary-color) !important;
				stroke: var(--mermaid-primary-border-color) !important;
				stroke-width: 2px !important;
			}
			
			.${className} .edgePath .path {
				stroke: var(--mermaid-line-color) !important;
				stroke-width: 2px !important;
			}
			
			.${className} .edgeLabel {
				background-color: var(--mermaid-edge-label-background) !important;
				color: var(--mermaid-primary-text-color) !important;
			}
			
			.${className} .actor {
				fill: var(--mermaid-actor-bkg) !important;
				stroke: var(--mermaid-actor-border) !important;
				stroke-width: 2px !important;
			}
			
			.${className} .actor-line {
				stroke: var(--mermaid-actor-line-color) !important;
			}
			
			.${className} .messageLine0,
			.${className} .messageLine1 {
				stroke: var(--mermaid-signal-color) !important;
				stroke-width: 2px !important;
			}
			
			.${className} .messageText {
				fill: var(--mermaid-signal-text-color) !important;
			}
		`;
	}

	private removePrettyMermaidStyles() {
		// Remove all pretty-mermaid classes from existing diagrams
		const enhancedElements = document.querySelectorAll('.pretty-mermaid-enhanced');
		enhancedElements.forEach((el) => {
			el.removeClass('pretty-mermaid-enhanced');
			el.removeClass('pretty-mermaid-classic');
			el.removeClass('pretty-mermaid-monochrome');
		});
		
		// Remove dynamically created style elements
		const styleElements = document.querySelectorAll('style[id^="pretty-mermaid-theme-"]');
		styleElements.forEach((el) => el.remove());
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

	private setupMutationObserver() {
		// Create mutation observer to watch for newly added Mermaid diagrams
		this.mutationObserver = new MutationObserver((mutations) => {
			if (!this.settings.enabled) return;
			
			let shouldProcess = false;
			
			mutations.forEach((mutation) => {
				// Check if new nodes were added
				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const element = node as HTMLElement;
							
							// Check if the added element is a mermaid diagram
							if (element.classList.contains('mermaid')) {
								shouldProcess = true;
							}
							
							// Check if the added element contains mermaid diagrams
							if (element.querySelectorAll && element.querySelectorAll('.mermaid').length > 0) {
								shouldProcess = true;
							}
						}
					});
				}
			});
			
			if (shouldProcess) {
				// Process new diagrams after a short delay to ensure they're fully rendered
				setTimeout(() => {
					this.processMermaidDiagrams(document.body);
				}, 100);
			}
		});
		
		// Start observing the document body for changes
		this.mutationObserver.observe(document.body, {
			childList: true,
			subtree: true
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
				.addOption('monochrome', 'Monochrome')
				.setValue(this.plugin.settings.theme)
				.onChange(async (value) => {
					this.plugin.settings.theme = value as PrettyMermaidSettings['theme'];
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Color Mode')
			.setDesc('Choose between dynamic automatic theme detection, always light, or always dark mode')
			.addDropdown(dropdown => dropdown
				.addOption('auto', 'Auto (Follow Obsidian)')
				.addOption('light', 'Light Mode')
				.addOption('dark', 'Dark Mode')
				.setValue(this.plugin.settings.colorMode || 'auto')
				.onChange(async (value) => {
					this.plugin.settings.colorMode = value as PrettyMermaidSettings['colorMode'];
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