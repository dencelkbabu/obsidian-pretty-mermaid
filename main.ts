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

interface ThemePalette {
	primaryColor: string;
	primaryTextColor: string;
	primaryBorderColor: string;
	lineColor: string;
	sectionBkgColor: string;
	altSectionBkgColor: string;
	gridColor: string;
	secondaryColor: string;
	tertiaryColor: string;
	background: string;
	mainBkg: string;
	secondBkg: string;
	tertiaryBkg: string;
	clusterBkg: string;
	clusterBorder: string;
	clusterTextColor: string;
	defaultLinkColor: string;
	titleColor: string;
	edgeLabelBackground: string;
	actorBorder: string;
	actorBkg: string;
	actorTextColor: string;
	actorLineColor: string;
	signalColor: string;
	signalTextColor: string;
	c0: string;
	c1: string;
	c2: string;
	c3: string;
	c4: string;
	c5: string;
	c6: string;
	c7: string;
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

		// Listen for theme / css changes (light/dark mode toggle)
		this.registerEvent(
			this.app.workspace.on('css-change', () => {
				if (this.settings.enabled) {
					this.applyMermaidTheme();
					this.updateModeClasses();
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

	public isDarkMode(): boolean {
		if (this.settings.colorMode === 'dark') return true;
		if (this.settings.colorMode === 'light') return false;
		return (
			document.body.classList.contains('theme-dark') ||
			(!document.body.classList.contains('theme-light') &&
				window.matchMedia('(prefers-color-scheme: dark)').matches)
		);
	}

	private processMermaidDiagrams(element: HTMLElement) {
		// Find all Mermaid diagrams in the element
		const mermaidElements = element.querySelectorAll('.mermaid');
		
		mermaidElements.forEach((mermaidEl) => {
			this.enhanceMermaidDiagram(mermaidEl as HTMLElement);
		});
	}

	private enhanceMermaidDiagram(element: HTMLElement) {
		if (!element.hasClass('pretty-mermaid-enhanced')) {
			element.addClass('pretty-mermaid-enhanced');
		}

		// Clean previous theme / mode classes
		element.removeClass('pretty-mermaid-classic');
		element.removeClass('pretty-mermaid-monochrome');
		element.removeClass('pretty-mermaid-mode-light');
		element.removeClass('pretty-mermaid-mode-dark');
		element.removeClass('pretty-mermaid-mode-auto');

		// Apply theme and mode classes
		element.addClass(`pretty-mermaid-${this.settings.theme}`);
		element.addClass(`pretty-mermaid-mode-${this.settings.colorMode}`);
		
		// Apply Mermaid theme variables by injecting CSS
		this.applyMermaidTheme();
	}

	public updateModeClasses() {
		document.querySelectorAll('.pretty-mermaid-enhanced').forEach((el) => {
			el.removeClass('pretty-mermaid-mode-light');
			el.removeClass('pretty-mermaid-mode-dark');
			el.removeClass('pretty-mermaid-mode-auto');
			el.addClass(`pretty-mermaid-mode-${this.settings.colorMode}`);
		});
	}

	private applyMermaidTheme() {
		const styleId = 'pretty-mermaid-theme-dynamic';
		let styleElement = document.getElementById(styleId);
		
		if (!styleElement) {
			styleElement = document.createElement('style');
			styleElement.id = styleId;
			document.head.appendChild(styleElement);
		}
		
		let css = this.generateAllThemesCss();
		if (this.settings.customCss && this.settings.customCss.trim().length > 0) {
			css += `\n/* Custom User CSS */\n${this.settings.customCss}\n`;
		}
		styleElement.textContent = css;
	}

	private getThemePalette(themeName: 'classic' | 'monochrome', isDark: boolean): ThemePalette {
		if (themeName === 'classic') {
			if (isDark) {
				return {
					primaryColor: '#2d224e',
					primaryTextColor: '#f8fafc',
					primaryBorderColor: '#a78bfa',
					lineColor: '#cbd5e1',
					sectionBkgColor: '#3b2f15',
					altSectionBkgColor: '#3b2f15',
					gridColor: '#334155',
					secondaryColor: '#3b2f15',
					tertiaryColor: '#1e1a30',
					background: '#181528',
					mainBkg: '#2d224e',
					secondBkg: '#3b2f15',
					tertiaryBkg: '#1e1a30',
					clusterBkg: '#221d26',
					clusterBorder: '#d97706',
					clusterTextColor: '#fde68a',
					defaultLinkColor: '#cbd5e1',
					titleColor: '#fde68a',
					edgeLabelBackground: '#1e1a30',
					actorBorder: '#a78bfa',
					actorBkg: '#2d224e',
					actorTextColor: '#f8fafc',
					actorLineColor: '#94a3b8',
					signalColor: '#cbd5e1',
					signalTextColor: '#f8fafc',
					c0: '#2d224e',
					c1: '#3b2f15',
					c2: '#1e1a30',
					c3: '#334155',
					c4: '#475569',
					c5: '#64748b',
					c6: '#94a3b8',
					c7: '#cbd5e1'
				};
			}
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
				clusterTextColor: '#333333',
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
		}

		// Monochrome theme
		if (isDark) {
			return {
				primaryColor: '#1f2937',
				primaryTextColor: '#f3f4f6',
				primaryBorderColor: '#64748b',
				lineColor: '#94a3b8',
				sectionBkgColor: '#111827',
				altSectionBkgColor: '#111827',
				gridColor: '#374151',
				secondaryColor: '#111827',
				tertiaryColor: '#1f2937',
				background: '#111827',
				mainBkg: '#1f2937',
				secondBkg: '#111827',
				tertiaryBkg: '#1f2937',
				clusterBkg: '#1e293b',
				clusterBorder: '#64748b',
				clusterTextColor: '#f3f4f6',
				defaultLinkColor: '#94a3b8',
				titleColor: '#f9fafb',
				edgeLabelBackground: '#1f2937',
				actorBorder: '#64748b',
				actorBkg: '#1f2937',
				actorTextColor: '#f3f4f6',
				actorLineColor: '#94a3b8',
				signalColor: '#94a3b8',
				signalTextColor: '#f3f4f6',
				c0: '#1f2937',
				c1: '#111827',
				c2: '#1e293b',
				c3: '#374151',
				c4: '#4b5563',
				c5: '#6b7280',
				c6: '#94a3b8',
				c7: '#f3f4f6'
			};
		}
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
			clusterTextColor: '#374151',
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

	private generateVariablesCss(selector: string, vars: ThemePalette): string {
		return `
${selector} {
  --mermaid-primary-color: ${vars.primaryColor};
  --mermaid-primary-text-color: ${vars.primaryTextColor};
  --mermaid-primary-border-color: ${vars.primaryBorderColor};
  --mermaid-line-color: ${vars.lineColor};
  --mermaid-section-bkg-color: ${vars.sectionBkgColor};
  --mermaid-alt-section-bkg-color: ${vars.altSectionBkgColor};
  --mermaid-grid-color: ${vars.gridColor};
  --mermaid-secondary-color: ${vars.secondaryColor};
  --mermaid-tertiary-color: ${vars.tertiaryColor};
  --mermaid-background: ${vars.background};
  --mermaid-main-bkg: ${vars.mainBkg};
  --mermaid-second-bkg: ${vars.secondBkg};
  --mermaid-tertiary-bkg: ${vars.tertiaryBkg};
  --mermaid-cluster-bkg: ${vars.clusterBkg};
  --mermaid-cluster-border: ${vars.clusterBorder};
  --mermaid-cluster-text-color: ${vars.clusterTextColor};
  --mermaid-default-link-color: ${vars.defaultLinkColor};
  --mermaid-title-color: ${vars.titleColor};
  --mermaid-edge-label-background: ${vars.edgeLabelBackground};
  --mermaid-actor-border: ${vars.actorBorder};
  --mermaid-actor-bkg: ${vars.actorBkg};
  --mermaid-actor-text-color: ${vars.actorTextColor};
  --mermaid-actor-line-color: ${vars.actorLineColor};
  --mermaid-signal-color: ${vars.signalColor};
  --mermaid-signal-text-color: ${vars.signalTextColor};
  --mermaid-c0: ${vars.c0};
  --mermaid-c1: ${vars.c1};
  --mermaid-c2: ${vars.c2};
  --mermaid-c3: ${vars.c3};
  --mermaid-c4: ${vars.c4};
  --mermaid-c5: ${vars.c5};
  --mermaid-c6: ${vars.c6};
  --mermaid-c7: ${vars.c7};
}`;
	}

	private generateAllThemesCss(): string {
		const themes: Array<'classic' | 'monochrome'> = ['classic', 'monochrome'];
		let css = '';

		for (const t of themes) {
			const lightVars = this.getThemePalette(t, false);
			const darkVars = this.getThemePalette(t, true);

			// Base default (light)
			css += this.generateVariablesCss(`.pretty-mermaid-${t}`, lightVars);

			// Light mode overrides
			css += this.generateVariablesCss(
				`.theme-light .pretty-mermaid-${t}, .pretty-mermaid-mode-light.pretty-mermaid-${t}, body:not(.theme-dark):not(.pretty-mermaid-mode-dark) .pretty-mermaid-${t}:not(.pretty-mermaid-mode-dark)`,
				lightVars
			);

			// Dark mode overrides (Obsidian dark theme or forced dark mode)
			css += this.generateVariablesCss(
				`.theme-dark .pretty-mermaid-${t}:not(.pretty-mermaid-mode-light), .pretty-mermaid-mode-dark.pretty-mermaid-${t}`,
				darkVars
			);

			// Dynamic variable mappings to SVG and HTML elements
			css += `
.pretty-mermaid-${t} .cluster rect,
.pretty-mermaid-${t} g.cluster rect {
  fill: var(--mermaid-cluster-bkg) !important;
  stroke: var(--mermaid-cluster-border) !important;
  stroke-width: 2px !important;
}

.pretty-mermaid-${t} .cluster .cluster-label,
.pretty-mermaid-${t} .cluster .nodeLabel,
.pretty-mermaid-${t} .cluster span,
.pretty-mermaid-${t} .cluster div,
.pretty-mermaid-${t} .cluster text,
.pretty-mermaid-${t} .cluster tspan {
  color: var(--mermaid-cluster-text-color) !important;
  fill: var(--mermaid-cluster-text-color) !important;
}

.pretty-mermaid-${t} .node rect,
.pretty-mermaid-${t} .node circle,
.pretty-mermaid-${t} .node ellipse,
.pretty-mermaid-${t} .node polygon,
.pretty-mermaid-${t} .node path {
  fill: var(--mermaid-primary-color) !important;
  stroke: var(--mermaid-primary-border-color) !important;
  stroke-width: 2px !important;
}

.pretty-mermaid-${t} .node .label,
.pretty-mermaid-${t} .node .nodeLabel,
.pretty-mermaid-${t} .node span,
.pretty-mermaid-${t} .node div,
.pretty-mermaid-${t} .node text,
.pretty-mermaid-${t} .node tspan {
  color: var(--mermaid-primary-text-color) !important;
  fill: var(--mermaid-primary-text-color) !important;
}

.pretty-mermaid-${t} .edgePath .path,
.pretty-mermaid-${t} .flowchart-link {
  stroke: var(--mermaid-line-color) !important;
  stroke-width: 2px !important;
}

.pretty-mermaid-${t} .marker,
.pretty-mermaid-${t} marker path {
  fill: var(--mermaid-line-color) !important;
  stroke: var(--mermaid-line-color) !important;
}

.pretty-mermaid-${t} .edgeLabel {
  background-color: var(--mermaid-edge-label-background) !important;
  color: var(--mermaid-primary-text-color) !important;
}

.pretty-mermaid-${t} .edgeLabel span,
.pretty-mermaid-${t} .edgeLabel text {
  color: var(--mermaid-primary-text-color) !important;
  fill: var(--mermaid-primary-text-color) !important;
}

.pretty-mermaid-${t} .actor {
  fill: var(--mermaid-actor-bkg) !important;
  stroke: var(--mermaid-actor-border) !important;
  stroke-width: 2px !important;
}

.pretty-mermaid-${t} .actor-line {
  stroke: var(--mermaid-actor-line-color) !important;
}

.pretty-mermaid-${t} .messageLine0,
.pretty-mermaid-${t} .messageLine1 {
  stroke: var(--mermaid-signal-color) !important;
  stroke-width: 2px !important;
}

.pretty-mermaid-${t} .messageText,
.pretty-mermaid-${t} .loopText {
  fill: var(--mermaid-signal-text-color) !important;
  color: var(--mermaid-signal-text-color) !important;
}
`;
		}

		return css;
	}

	private removePrettyMermaidStyles() {
		// Remove all pretty-mermaid classes from existing diagrams
		const enhancedElements = document.querySelectorAll('.pretty-mermaid-enhanced');
		enhancedElements.forEach((el) => {
			el.removeClass('pretty-mermaid-enhanced');
			el.removeClass('pretty-mermaid-classic');
			el.removeClass('pretty-mermaid-monochrome');
			el.removeClass('pretty-mermaid-mode-light');
			el.removeClass('pretty-mermaid-mode-dark');
			el.removeClass('pretty-mermaid-mode-auto');
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