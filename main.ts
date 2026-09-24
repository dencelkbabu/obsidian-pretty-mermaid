import { App, Plugin, PluginSettingTab, Setting, loadMermaid, MarkdownPostProcessorContext, Modal, Notice, setIcon } from 'obsidian';

export const AVAILABLE_THEMES = [
	'adaptive',
	'catppuccin',
	'tokyo-night',
	'nord',
	'minimalist',
	'classic',
	'monochrome'
] as const;

export type MermaidTheme = typeof AVAILABLE_THEMES[number];
export type FlowchartCurve = 'natural' | 'basis' | 'cardinal' | 'linear' | 'default';

export interface DiagramDirectives {
	theme?: MermaidTheme;
	mode?: 'auto' | 'light' | 'dark';
	zoom?: boolean;
}

interface PrettyMermaidSettings {
	enabled: boolean;
	theme: MermaidTheme;
	colorMode: 'auto' | 'light' | 'dark';
	flowchartCurve: FlowchartCurve;
	enableToolbar: boolean;
	enableZoom: boolean;
	customCss: string;
}

const DEFAULT_SETTINGS: PrettyMermaidSettings = {
	enabled: true,
	theme: 'adaptive',
	colorMode: 'auto',
	flowchartCurve: 'natural',
	enableToolbar: true,
	enableZoom: true,
	customCss: ''
};

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
		await this.applyMermaidConfig();

		// Add settings tab
		this.addSettingTab(new PrettyMermaidSettingTab(this.app, this));

		// Register markdown post processor to enhance Mermaid diagrams
		this.registerMarkdownPostProcessor((element, context) => {
			if (this.settings.enabled) {
				this.processMermaidDiagrams(element, context);
				// Also retry after a delay to catch async-rendered diagrams
				setTimeout(() => {
					this.processMermaidDiagrams(element, context);
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
		await this.applyMermaidConfig();
		// Refresh all Mermaid diagrams when settings change
		this.refreshAllMermaidDiagrams();
	}

	public async applyMermaidConfig() {
		try {
			const mermaid = await loadMermaid();
			if (mermaid) {
				const curve = (!this.settings.flowchartCurve || this.settings.flowchartCurve === 'default') ? 'linear' : this.settings.flowchartCurve;
				mermaid.initialize({
					startOnLoad: false,
					theme: 'base',
					flowchart: {
						curve: curve,
						padding: 24,
						nodeSpacing: 50,
						rankSpacing: 50,
						htmlLabels: true,
						useMaxWidth: true
					},
					themeVariables: {
						fontFamily: 'var(--font-interface), var(--font-text), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
						fontSize: '14px',
						nodePadding: '24px',
						edgeLabelBackground: 'transparent'
					}
				});
			}
		} catch (e) {
			console.log('Pretty Mermaid: Mermaid configuration initialized', e);
		}
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

	private parseDirectivesFromText(text: string): DiagramDirectives {
		const directives: DiagramDirectives = {};
		if (!text) return directives;

		const lines = text.split('\n');
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed.startsWith('%%')) continue;
			const match = trimmed.match(/^%%\s*([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);
			if (match) {
				const key = match[1].toLowerCase();
				const val = match[2].trim().toLowerCase();
				if (key === 'theme') {
					if ((AVAILABLE_THEMES as readonly string[]).includes(val)) {
						directives.theme = val as MermaidTheme;
					}
				} else if (key === 'mode') {
					if (val === 'auto' || val === 'light' || val === 'dark') {
						directives.mode = val;
					}
				} else if (key === 'zoom') {
					directives.zoom = val === 'true' || val === 'yes' || val === '1';
				}
			}
		}
		return directives;
	}

	private processMermaidDiagrams(element: HTMLElement, context?: MarkdownPostProcessorContext) {
		// Find all Mermaid diagrams in the element
		const mermaidElements = element.querySelectorAll('.mermaid');
		
		mermaidElements.forEach((mermaidEl) => {
			const el = mermaidEl as HTMLElement;

			// Extract directives if present in raw text before SVG replacement
			if (el.textContent && el.textContent.includes('%%')) {
				const directives = this.parseDirectivesFromText(el.textContent);
				if (Object.keys(directives).length > 0) {
					el.dataset.pmDirectives = JSON.stringify(directives);
				}
			} else if (context) {
				const section = context.getSectionInfo(el);
				if (section) {
					const text = section.text.split('\n').slice(section.lineStart, section.lineEnd + 1).join('\n');
					const directives = this.parseDirectivesFromText(text);
					if (Object.keys(directives).length > 0) {
						el.dataset.pmDirectives = JSON.stringify(directives);
					}
				}
			}

			this.enhanceMermaidDiagram(el);
		});
	}

	private enhanceMermaidDiagram(element: HTMLElement) {
		if (!element.hasClass('pretty-mermaid-enhanced')) {
			element.addClass('pretty-mermaid-enhanced');
		}

		let directives: DiagramDirectives = {};
		if (element.dataset.pmDirectives) {
			try {
				directives = JSON.parse(element.dataset.pmDirectives);
			} catch (e) {
				// ignore
			}
		}

		const theme = directives.theme || this.settings.theme;
		const mode = directives.mode || this.settings.colorMode;

		// Clean previous theme / mode classes
		AVAILABLE_THEMES.forEach((t) => element.removeClass(`pretty-mermaid-${t}`));
		element.removeClass('pretty-mermaid-mode-light');
		element.removeClass('pretty-mermaid-mode-dark');
		element.removeClass('pretty-mermaid-mode-auto');

		// Apply theme and mode classes
		element.addClass(`pretty-mermaid-${theme}`);
		element.addClass(`pretty-mermaid-mode-${mode}`);
		element.setAttribute('data-theme', theme);
		element.setAttribute('data-mode', mode);
		if (directives.zoom !== undefined) {
			element.setAttribute('data-zoom', String(directives.zoom));
		}
		
		// Apply Mermaid theme variables by injecting CSS
		this.applyMermaidTheme();

		// Attach interactive toolbar if enabled
		if (this.settings.enableToolbar) {
			this.attachToolbar(element, directives);
		}
	}

	private attachToolbar(element: HTMLElement, directives: DiagramDirectives) {
		if (element.querySelector(':scope > .pretty-mermaid-toolbar')) return;

		const svg = element.querySelector('svg');
		if (!svg) {
			setTimeout(() => {
				const retrySvg = element.querySelector('svg');
				if (retrySvg && !element.querySelector(':scope > .pretty-mermaid-toolbar')) {
					this.attachToolbar(element, directives);
				}
			}, 150);
			return;
		}

		element.style.position = 'relative';

		const toolbar = document.createElement('div');
		toolbar.className = 'pretty-mermaid-toolbar';

		let zoom = 1.0;
		let panX = 0;
		let panY = 0;
		let isPanning = false;
		let startX = 0;
		let startY = 0;

		const updateTransform = (withTransition = true) => {
			svg.style.transition = withTransition ? 'transform 0.15s ease-out' : 'none';
			svg.style.transformOrigin = 'center center';
			svg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
		};

		const allowZoom = directives.zoom !== undefined ? directives.zoom : this.settings.enableZoom;

		if (allowZoom) {
			const zoomInBtn = document.createElement('button');
			zoomInBtn.className = 'pretty-mermaid-toolbar-btn';
			zoomInBtn.title = 'Zoom in';
			setIcon(zoomInBtn, 'zoom-in');
			zoomInBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				zoom = Math.min(zoom * 1.25, 4.0);
				updateTransform(true);
			});
			toolbar.appendChild(zoomInBtn);

			const zoomOutBtn = document.createElement('button');
			zoomOutBtn.className = 'pretty-mermaid-toolbar-btn';
			zoomOutBtn.title = 'Zoom out';
			setIcon(zoomOutBtn, 'zoom-out');
			zoomOutBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				zoom = Math.max(zoom / 1.25, 0.3);
				updateTransform(true);
			});
			toolbar.appendChild(zoomOutBtn);

			const resetBtn = document.createElement('button');
			resetBtn.className = 'pretty-mermaid-toolbar-btn';
			resetBtn.title = 'Reset view (100%)';
			setIcon(resetBtn, 'rotate-ccw');
			resetBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				zoom = 1.0;
				panX = 0;
				panY = 0;
				updateTransform(true);
			});
			toolbar.appendChild(resetBtn);

			const sep1 = document.createElement('div');
			sep1.className = 'pretty-mermaid-toolbar-sep';
			toolbar.appendChild(sep1);

			element.addEventListener('wheel', (e: WheelEvent) => {
				if (e.ctrlKey || e.metaKey || directives.zoom) {
					e.preventDefault();
					const delta = e.deltaY < 0 ? 1.15 : 0.87;
					zoom = Math.max(0.3, Math.min(4.0, zoom * delta));
					updateTransform(false);
				}
			}, { passive: false });

			element.addEventListener('mousedown', (e: MouseEvent) => {
				if (e.button !== 0 || (e.target as HTMLElement).closest('.pretty-mermaid-toolbar')) return;
				if (zoom > 1.0 || directives.zoom) {
					isPanning = true;
					startX = e.clientX - panX;
					startY = e.clientY - panY;
					element.style.cursor = 'grabbing';
				}
			});

			window.addEventListener('mousemove', (e: MouseEvent) => {
				if (!isPanning) return;
				panX = e.clientX - startX;
				panY = e.clientY - startY;
				updateTransform(false);
			});

			window.addEventListener('mouseup', () => {
				if (isPanning) {
					isPanning = false;
					element.style.cursor = '';
				}
			});
		}

		// Copy PNG
		const copyPngBtn = document.createElement('button');
		copyPngBtn.className = 'pretty-mermaid-toolbar-btn';
		copyPngBtn.title = 'Copy diagram as PNG';
		setIcon(copyPngBtn, 'image');
		copyPngBtn.addEventListener('click', async (e) => {
			e.stopPropagation();
			await this.copyDiagramAsPng(svg as SVGSVGElement);
		});
		toolbar.appendChild(copyPngBtn);

		// Copy SVG
		const copySvgBtn = document.createElement('button');
		copySvgBtn.className = 'pretty-mermaid-toolbar-btn';
		copySvgBtn.title = 'Copy SVG markup';
		setIcon(copySvgBtn, 'copy');
		copySvgBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.copyDiagramAsSvg(svg as SVGSVGElement);
		});
		toolbar.appendChild(copySvgBtn);

		// Focus / Fullscreen
		const focusBtn = document.createElement('button');
		focusBtn.className = 'pretty-mermaid-toolbar-btn';
		focusBtn.title = 'Fullscreen focus view';
		setIcon(focusBtn, 'maximize');
		focusBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			new MermaidFocusModal(this.app, svg as SVGSVGElement).open();
		});
		toolbar.appendChild(focusBtn);

		element.prepend(toolbar);
	}

	private async copyDiagramAsPng(svgElement: SVGSVGElement) {
		try {
			const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
			svgClone.style.transform = 'none';

			const bbox = svgElement.getBBox ? svgElement.getBBox() : { width: 800, height: 600 };
			const width = svgElement.clientWidth || bbox.width || 800;
			const height = svgElement.clientHeight || bbox.height || 600;

			svgClone.setAttribute('width', `${width}`);
			svgClone.setAttribute('height', `${height}`);

			const svgData = new XMLSerializer().serializeToString(svgClone);
			const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
			const URL = window.URL || window.webkitURL || window;
			const blobURL = URL.createObjectURL(svgBlob);

			const img = new Image();
			img.onload = () => {
				const scale = 2;
				const canvas = document.createElement('canvas');
				canvas.width = width * scale;
				canvas.height = height * scale;
				const ctx = canvas.getContext('2d');
				if (!ctx) return;
				ctx.scale(scale, scale);
				ctx.drawImage(img, 0, 0);
				URL.revokeObjectURL(blobURL);

				canvas.toBlob(async (blob) => {
					if (!blob) return;
					try {
						await navigator.clipboard.write([
							new ClipboardItem({ 'image/png': blob })
						]);
						new Notice('Diagram copied to clipboard as PNG');
					} catch (e) {
						const a = document.createElement('a');
						a.download = 'mermaid-diagram.png';
						a.href = canvas.toDataURL('image/png');
						a.click();
						new Notice('Diagram downloaded as PNG');
					}
				}, 'image/png');
			};
			img.src = blobURL;
		} catch (err) {
			console.error('Pretty Mermaid: Failed to export diagram as PNG', err);
			new Notice('Failed to export diagram as PNG');
		}
	}

	private copyDiagramAsSvg(svgElement: SVGSVGElement) {
		try {
			const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
			svgClone.style.transform = 'none';
			const svgData = new XMLSerializer().serializeToString(svgClone);
			navigator.clipboard.writeText(svgData);
			new Notice('SVG markup copied to clipboard');
		} catch (err) {
			console.error('Pretty Mermaid: Failed to copy SVG', err);
			new Notice('Failed to copy SVG');
		}
	}


	public updateModeClasses() {
		document.querySelectorAll('.pretty-mermaid-enhanced').forEach((el) => {
			const htmlEl = el as HTMLElement;
			let directives: DiagramDirectives = {};
			if (htmlEl.dataset.pmDirectives) {
				try {
					directives = JSON.parse(htmlEl.dataset.pmDirectives);
				} catch (e) {}
			}
			const mode = directives.mode || this.settings.colorMode;
			htmlEl.removeClass('pretty-mermaid-mode-light');
			htmlEl.removeClass('pretty-mermaid-mode-dark');
			htmlEl.removeClass('pretty-mermaid-mode-auto');
			htmlEl.addClass(`pretty-mermaid-mode-${mode}`);
			htmlEl.setAttribute('data-mode', mode);
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

	private getThemePalette(themeName: MermaidTheme, isDark: boolean): ThemePalette {
		if (themeName === 'adaptive') {
			if (isDark) {
				return {
					primaryColor: 'var(--background-primary, #1e1e24)',
					primaryTextColor: 'var(--text-normal, #dcddde)',
					primaryBorderColor: 'var(--background-modifier-border, #3a3b44)',
					lineColor: 'var(--text-muted, #94a3b8)',
					sectionBkgColor: 'var(--background-secondary, #16161a)',
					altSectionBkgColor: 'var(--background-secondary, #16161a)',
					gridColor: 'var(--background-modifier-border, #334155)',
					secondaryColor: 'var(--background-secondary, #16161a)',
					tertiaryColor: 'var(--background-secondary-alt, #23242b)',
					background: 'var(--background-secondary, #121214)',
					mainBkg: 'var(--background-primary, #1e1e24)',
					secondBkg: 'var(--background-secondary, #16161a)',
					tertiaryBkg: 'var(--background-secondary-alt, #23242b)',
					clusterBkg: 'var(--background-secondary, #16161a)',
					clusterBorder: 'var(--interactive-accent, #8b5cf6)',
					clusterTextColor: 'var(--text-normal, #dcddde)',
					defaultLinkColor: 'var(--text-muted, #94a3b8)',
					titleColor: 'var(--text-normal, #dcddde)',
					edgeLabelBackground: 'var(--background-primary, #121214)',
					actorBorder: 'var(--interactive-accent, #8b5cf6)',
					actorBkg: 'var(--background-primary, #1e1e24)',
					actorTextColor: 'var(--text-normal, #dcddde)',
					actorLineColor: 'var(--text-muted, #94a3b8)',
					signalColor: 'var(--interactive-accent, #8b5cf6)',
					signalTextColor: 'var(--text-normal, #dcddde)',
					c0: 'var(--background-primary, #1e1e24)',
					c1: 'var(--background-secondary, #16161a)',
					c2: 'var(--background-secondary-alt, #23242b)',
					c3: 'var(--interactive-accent, #8b5cf6)',
					c4: 'var(--color-blue, #60a5fa)',
					c5: 'var(--color-green, #4ade80)',
					c6: 'var(--color-orange, #fb923c)',
					c7: 'var(--color-red, #f87171)'
				};
			}
			return {
				primaryColor: 'var(--background-primary, #ffffff)',
				primaryTextColor: 'var(--text-normal, #1e293b)',
				primaryBorderColor: 'var(--background-modifier-border, #e2e8f0)',
				lineColor: 'var(--text-muted, #64748b)',
				sectionBkgColor: 'var(--background-secondary, #f1f5f9)',
				altSectionBkgColor: 'var(--background-secondary, #f1f5f9)',
				gridColor: 'var(--background-modifier-border, #cbd5e1)',
				secondaryColor: 'var(--background-secondary, #f1f5f9)',
				tertiaryColor: 'var(--background-secondary-alt, #e2e8f0)',
				background: 'var(--background-secondary, #f8fafc)',
				mainBkg: 'var(--background-primary, #ffffff)',
				secondBkg: 'var(--background-secondary, #f1f5f9)',
				tertiaryBkg: 'var(--background-secondary-alt, #e2e8f0)',
				clusterBkg: 'var(--background-secondary, #f1f5f9)',
				clusterBorder: 'var(--interactive-accent, #7c3aed)',
				clusterTextColor: 'var(--text-normal, #1e293b)',
				defaultLinkColor: 'var(--text-muted, #64748b)',
				titleColor: 'var(--text-normal, #1e293b)',
				edgeLabelBackground: 'var(--background-primary, #ffffff)',
				actorBorder: 'var(--interactive-accent, #7c3aed)',
				actorBkg: 'var(--background-primary, #ffffff)',
				actorTextColor: 'var(--text-normal, #1e293b)',
				actorLineColor: 'var(--text-muted, #64748b)',
				signalColor: 'var(--interactive-accent, #7c3aed)',
				signalTextColor: 'var(--text-normal, #1e293b)',
				c0: 'var(--background-primary, #ffffff)',
				c1: 'var(--background-secondary, #f1f5f9)',
				c2: 'var(--background-secondary-alt, #e2e8f0)',
				c3: 'var(--interactive-accent, #7c3aed)',
				c4: 'var(--color-blue, #2563eb)',
				c5: 'var(--color-green, #16a34a)',
				c6: 'var(--color-orange, #ea580c)',
				c7: 'var(--color-red, #dc2626)'
			};
		}

		if (themeName === 'catppuccin') {
			if (isDark) {
				// Catppuccin Mocha
				return {
					primaryColor: '#313244',
					primaryTextColor: '#cdd6f4',
					primaryBorderColor: '#585b70',
					lineColor: '#89dceb',
					sectionBkgColor: '#181825',
					altSectionBkgColor: '#181825',
					gridColor: '#45475a',
					secondaryColor: '#1e1e2e',
					tertiaryColor: '#11111b',
					background: '#1e1e2e',
					mainBkg: '#313244',
					secondBkg: '#181825',
					tertiaryBkg: '#11111b',
					clusterBkg: '#181825',
					clusterBorder: '#cba6f7',
					clusterTextColor: '#cdd6f4',
					defaultLinkColor: '#89dceb',
					titleColor: '#cba6f7',
					edgeLabelBackground: '#1e1e2e',
					actorBorder: '#b4befe',
					actorBkg: '#313244',
					actorTextColor: '#cdd6f4',
					actorLineColor: '#6c7086',
					signalColor: '#f5c2e7',
					signalTextColor: '#cdd6f4',
					c0: '#313244',
					c1: '#181825',
					c2: '#45475a',
					c3: '#cba6f7',
					c4: '#89b4fa',
					c5: '#a6e3a1',
					c6: '#fab387',
					c7: '#f38ba8'
				};
			}
			// Catppuccin Latte
			return {
				primaryColor: '#e6e9ef',
				primaryTextColor: '#4c4f69',
				primaryBorderColor: '#acb0be',
				lineColor: '#04a5e5',
				sectionBkgColor: '#eff1f5',
				altSectionBkgColor: '#eff1f5',
				gridColor: '#ccd0da',
				secondaryColor: '#dce0e8',
				tertiaryColor: '#eff1f5',
				background: '#eff1f5',
				mainBkg: '#e6e9ef',
				secondBkg: '#eff1f5',
				tertiaryBkg: '#dce0e8',
				clusterBkg: '#eff1f5',
				clusterBorder: '#8839ef',
				clusterTextColor: '#4c4f69',
				defaultLinkColor: '#04a5e5',
				titleColor: '#8839ef',
				edgeLabelBackground: '#eff1f5',
				actorBorder: '#7287fd',
				actorBkg: '#e6e9ef',
				actorTextColor: '#4c4f69',
				actorLineColor: '#9ca0b0',
				signalColor: '#ea76cb',
				signalTextColor: '#4c4f69',
				c0: '#e6e9ef',
				c1: '#eff1f5',
				c2: '#ccd0da',
				c3: '#8839ef',
				c4: '#1e66f5',
				c5: '#40a02b',
				c6: '#fe640b',
				c7: '#d20f39'
			};
		}

		if (themeName === 'tokyo-night') {
			if (isDark) {
				return {
					primaryColor: '#24283b',
					primaryTextColor: '#c0caf5',
					primaryBorderColor: '#414868',
					lineColor: '#7aa2f7',
					sectionBkgColor: '#1f2335',
					altSectionBkgColor: '#1f2335',
					gridColor: '#292e42',
					secondaryColor: '#16161e',
					tertiaryColor: '#1a1b26',
					background: '#1a1b26',
					mainBkg: '#24283b',
					secondBkg: '#1f2335',
					tertiaryBkg: '#16161e',
					clusterBkg: '#1f2335',
					clusterBorder: '#bb9af7',
					clusterTextColor: '#c0caf5',
					defaultLinkColor: '#7aa2f7',
					titleColor: '#7dcfff',
					edgeLabelBackground: '#1a1b26',
					actorBorder: '#bb9af7',
					actorBkg: '#24283b',
					actorTextColor: '#c0caf5',
					actorLineColor: '#565f89',
					signalColor: '#7dcfff',
					signalTextColor: '#c0caf5',
					c0: '#24283b',
					c1: '#1f2335',
					c2: '#292e42',
					c3: '#bb9af7',
					c4: '#7aa2f7',
					c5: '#9ece6a',
					c6: '#ff9e64',
					c7: '#f7768e'
				};
			}
			return {
				primaryColor: '#e9e9ed',
				primaryTextColor: '#3760bf',
				primaryBorderColor: '#b4b5b9',
				lineColor: '#2e7de9',
				sectionBkgColor: '#d5d6db',
				altSectionBkgColor: '#d5d6db',
				gridColor: '#cfd0d5',
				secondaryColor: '#e1e2e7',
				tertiaryColor: '#f2f3f5',
				background: '#f2f3f5',
				mainBkg: '#e9e9ed',
				secondBkg: '#d5d6db',
				tertiaryBkg: '#e1e2e7',
				clusterBkg: '#e1e2e7',
				clusterBorder: '#9854f1',
				clusterTextColor: '#3760bf',
				defaultLinkColor: '#2e7de9',
				titleColor: '#9854f1',
				edgeLabelBackground: '#f2f3f5',
				actorBorder: '#9854f1',
				actorBkg: '#e9e9ed',
				actorTextColor: '#3760bf',
				actorLineColor: '#848998',
				signalColor: '#007197',
				signalTextColor: '#3760bf',
				c0: '#e9e9ed',
				c1: '#d5d6db',
				c2: '#cfd0d5',
				c3: '#9854f1',
				c4: '#2e7de9',
				c5: '#587539',
				c6: '#b15c00',
				c7: '#8c4351'
			};
		}

		if (themeName === 'nord') {
			if (isDark) {
				return {
					primaryColor: '#3b4252',
					primaryTextColor: '#eceff4',
					primaryBorderColor: '#4c566a',
					lineColor: '#88c0d0',
					sectionBkgColor: '#2e3440',
					altSectionBkgColor: '#2e3440',
					gridColor: '#434c5e',
					secondaryColor: '#2e3440',
					tertiaryColor: '#3b4252',
					background: '#2e3440',
					mainBkg: '#3b4252',
					secondBkg: '#2e3440',
					tertiaryBkg: '#2e3440',
					clusterBkg: '#2e3440',
					clusterBorder: '#88c0d0',
					clusterTextColor: '#eceff4',
					defaultLinkColor: '#88c0d0',
					titleColor: '#8fbcbb',
					edgeLabelBackground: '#2e3440',
					actorBorder: '#81a1c1',
					actorBkg: '#3b4252',
					actorTextColor: '#eceff4',
					actorLineColor: '#4c566a',
					signalColor: '#88c0d0',
					signalTextColor: '#eceff4',
					c0: '#3b4252',
					c1: '#2e3440',
					c2: '#434c5e',
					c3: '#88c0d0',
					c4: '#81a1c1',
					c5: '#a3be8c',
					c6: '#d08770',
					c7: '#bf616a'
				};
			}
			return {
				primaryColor: '#e5e9f0',
				primaryTextColor: '#2e3440',
				primaryBorderColor: '#d8dee9',
				lineColor: '#5e81ac',
				sectionBkgColor: '#eceff4',
				altSectionBkgColor: '#eceff4',
				gridColor: '#d8dee9',
				secondaryColor: '#f0f4f8',
				tertiaryColor: '#e5e9f0',
				background: '#eceff4',
				mainBkg: '#e5e9f0',
				secondBkg: '#eceff4',
				tertiaryBkg: '#f0f4f8',
				clusterBkg: '#eceff4',
				clusterBorder: '#5e81ac',
				clusterTextColor: '#2e3440',
				defaultLinkColor: '#5e81ac',
				titleColor: '#5e81ac',
				edgeLabelBackground: '#eceff4',
				actorBorder: '#5e81ac',
				actorBkg: '#e5e9f0',
				actorTextColor: '#2e3440',
				actorLineColor: '#d8dee9',
				signalColor: '#5e81ac',
				signalTextColor: '#2e3440',
				c0: '#e5e9f0',
				c1: '#eceff4',
				c2: '#d8dee9',
				c3: '#5e81ac',
				c4: '#81a1c1',
				c5: '#a3be8c',
				c6: '#d08770',
				c7: '#bf616a'
			};
		}

		if (themeName === 'minimalist') {
			if (isDark) {
				return {
					primaryColor: '#1e293b',
					primaryTextColor: '#f8fafc',
					primaryBorderColor: '#334155',
					lineColor: '#94a3b8',
					sectionBkgColor: '#0f172a',
					altSectionBkgColor: '#0f172a',
					gridColor: '#1e293b',
					secondaryColor: '#0f172a',
					tertiaryColor: '#1e293b',
					background: '#0f172a',
					mainBkg: '#1e293b',
					secondBkg: '#0f172a',
					tertiaryBkg: '#1e293b',
					clusterBkg: '#0f172a',
					clusterBorder: '#10b981',
					clusterTextColor: '#f8fafc',
					defaultLinkColor: '#94a3b8',
					titleColor: '#10b981',
					edgeLabelBackground: '#0f172a',
					actorBorder: '#10b981',
					actorBkg: '#1e293b',
					actorTextColor: '#f8fafc',
					actorLineColor: '#334155',
					signalColor: '#10b981',
					signalTextColor: '#f8fafc',
					c0: '#1e293b',
					c1: '#0f172a',
					c2: '#334155',
					c3: '#10b981',
					c4: '#3b82f6',
					c5: '#10b981',
					c6: '#f59e0b',
					c7: '#ef4444'
				};
			}
			return {
				primaryColor: '#ffffff',
				primaryTextColor: '#0f172a',
				primaryBorderColor: '#e2e8f0',
				lineColor: '#64748b',
				sectionBkgColor: '#f8fafc',
				altSectionBkgColor: '#f8fafc',
				gridColor: '#e2e8f0',
				secondaryColor: '#f1f5f9',
				tertiaryColor: '#ffffff',
				background: '#ffffff',
				mainBkg: '#ffffff',
				secondBkg: '#f8fafc',
				tertiaryBkg: '#f1f5f9',
				clusterBkg: '#f8fafc',
				clusterBorder: '#059669',
				clusterTextColor: '#0f172a',
				defaultLinkColor: '#64748b',
				titleColor: '#059669',
				edgeLabelBackground: '#ffffff',
				actorBorder: '#059669',
				actorBkg: '#ffffff',
				actorTextColor: '#0f172a',
				actorLineColor: '#cbd5e1',
				signalColor: '#059669',
				signalTextColor: '#0f172a',
				c0: '#ffffff',
				c1: '#f8fafc',
				c2: '#e2e8f0',
				c3: '#059669',
				c4: '#2563eb',
				c5: '#059669',
				c6: '#d97706',
				c7: '#dc2626'
			};
		}

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
					edgeLabelBackground: '#181528',
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
				primaryTextColor: '#1e1b4b',
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
				edgeLabelBackground: '#ffffff',
				actorBorder: '#9370DB',
				actorBkg: '#ECECFF',
				actorTextColor: '#1e1b4b',
				actorLineColor: '#333333',
				signalColor: '#333333',
				signalTextColor: '#1e1b4b',
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
		let css = '';

		for (const t of AVAILABLE_THEMES) {
			const lightVars = this.getThemePalette(t, false);
			const darkVars = this.getThemePalette(t, true);

			// Base default (light)
			css += this.generateVariablesCss(`.pretty-mermaid-${t}`, lightVars);

			// Light mode overrides
			css += this.generateVariablesCss(
				`.theme-light .pretty-mermaid-${t}, .pretty-mermaid-mode-light.pretty-mermaid-${t}`,
				lightVars
			);

			// Dark mode overrides (Obsidian dark theme or forced dark mode)
			css += this.generateVariablesCss(
				`.theme-dark .pretty-mermaid-${t}, .pretty-mermaid-mode-dark.pretty-mermaid-${t}`,
				darkVars
			);

			// Explicit mode class on container always takes precedence
			css += this.generateVariablesCss(`.pretty-mermaid-mode-light.pretty-mermaid-${t}`, lightVars);
			css += this.generateVariablesCss(`.pretty-mermaid-mode-dark.pretty-mermaid-${t}`, darkVars);
		}

		// Common dynamic variable mappings to SVG and HTML elements
		css += `
.pretty-mermaid-enhanced .cluster rect,
.pretty-mermaid-enhanced g.cluster rect {
  fill: var(--mermaid-cluster-bkg) !important;
  stroke: var(--mermaid-cluster-border) !important;
  stroke-width: 1.5px !important;
}

.pretty-mermaid-enhanced .cluster .cluster-label,
.pretty-mermaid-enhanced .cluster .nodeLabel,
.pretty-mermaid-enhanced .cluster span,
.pretty-mermaid-enhanced .cluster div,
.pretty-mermaid-enhanced .cluster text,
.pretty-mermaid-enhanced .cluster tspan {
  color: var(--mermaid-cluster-text-color) !important;
  fill: var(--mermaid-cluster-text-color) !important;
}

.pretty-mermaid-enhanced .node rect,
.pretty-mermaid-enhanced .node circle,
.pretty-mermaid-enhanced .node ellipse,
.pretty-mermaid-enhanced .node polygon,
.pretty-mermaid-enhanced .node path {
  fill: var(--mermaid-primary-color) !important;
  stroke: var(--mermaid-primary-border-color) !important;
  stroke-width: 1.5px !important;
}

.pretty-mermaid-enhanced .node foreignObject {
  overflow: visible !important;
}

.pretty-mermaid-enhanced .node foreignObject > div {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  width: 100% !important;
  height: 100% !important;
  box-sizing: border-box !important;
  line-height: 1.35 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.pretty-mermaid-enhanced .node .label {
  text-align: center !important;
  overflow: visible !important;
}

.pretty-mermaid-enhanced .node .label,
.pretty-mermaid-enhanced .node .nodeLabel,
.pretty-mermaid-enhanced .node span,
.pretty-mermaid-enhanced .node div,
.pretty-mermaid-enhanced .node text,
.pretty-mermaid-enhanced .node tspan {
  color: var(--mermaid-primary-text-color) !important;
  fill: var(--mermaid-primary-text-color) !important;
}

.pretty-mermaid-enhanced .edgePath .path,
.pretty-mermaid-enhanced .flowchart-link {
  stroke: var(--mermaid-line-color) !important;
  stroke-width: 1.5px !important;
}

.pretty-mermaid-enhanced .marker,
.pretty-mermaid-enhanced marker path {
  fill: var(--mermaid-line-color) !important;
  stroke: var(--mermaid-line-color) !important;
}

.pretty-mermaid-enhanced .edgeLabels,
.pretty-mermaid-enhanced .edgeLabels g,
.pretty-mermaid-enhanced .edgeLabel,
.pretty-mermaid-enhanced .edgeLabel g,
.pretty-mermaid-enhanced .edgeLabel .label,
.pretty-mermaid-enhanced .edgeLabel foreignObject,
.pretty-mermaid-enhanced .edgeLabel foreignObject > div {
  background: transparent !important;
  background-color: transparent !important;
}

.pretty-mermaid-enhanced g.edgeLabels rect,
.pretty-mermaid-enhanced g.edgeLabel rect,
.pretty-mermaid-enhanced .edgeLabel rect,
.pretty-mermaid-enhanced .edgeLabels rect,
.pretty-mermaid-enhanced .edgeLabel polygon,
.pretty-mermaid-enhanced .edgeLabel path {
  display: none !important;
  fill: transparent !important;
  stroke: transparent !important;
  opacity: 0 !important;
}

.pretty-mermaid-enhanced .edgeLabel span,
.pretty-mermaid-enhanced .edgeLabel .label span,
.pretty-mermaid-enhanced span.edgeLabel {
  background-color: var(--mermaid-edge-label-background, var(--background-primary)) !important;
  color: var(--mermaid-primary-text-color, var(--text-normal)) !important;
  border: 1px solid var(--background-modifier-border, rgba(127, 127, 127, 0.25)) !important;
  border-radius: 6px !important;
  padding: 3px 10px !important;
  font-size: 0.82em !important;
  font-weight: 500 !important;
  display: inline-block !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.pretty-mermaid-enhanced .edgeLabel text,
.pretty-mermaid-enhanced .edgeLabel tspan {
  fill: var(--mermaid-primary-text-color, var(--text-normal)) !important;
  color: var(--mermaid-primary-text-color, var(--text-normal)) !important;
}

.pretty-mermaid-enhanced .actor {
  fill: var(--mermaid-actor-bkg) !important;
  stroke: var(--mermaid-actor-border) !important;
  stroke-width: 1.5px !important;
}

.pretty-mermaid-enhanced .actor-line {
  stroke: var(--mermaid-actor-line-color) !important;
}

.pretty-mermaid-enhanced .messageLine0,
.pretty-mermaid-enhanced .messageLine1 {
  stroke: var(--mermaid-signal-color) !important;
  stroke-width: 1.5px !important;
}

.pretty-mermaid-enhanced .messageText,
.pretty-mermaid-enhanced .loopText {
  fill: var(--mermaid-signal-text-color) !important;
  color: var(--mermaid-signal-text-color) !important;
}
`;

		return css;
	}

	private removePrettyMermaidStyles() {
		// Remove all pretty-mermaid classes and data attributes from existing diagrams
		const enhancedElements = document.querySelectorAll('.pretty-mermaid-enhanced');
		enhancedElements.forEach((el) => {
			el.removeClass('pretty-mermaid-enhanced');
			AVAILABLE_THEMES.forEach((t) => el.removeClass(`pretty-mermaid-${t}`));
			el.removeClass('pretty-mermaid-mode-light');
			el.removeClass('pretty-mermaid-mode-dark');
			el.removeClass('pretty-mermaid-mode-auto');
			el.removeAttribute('data-theme');
			el.removeAttribute('data-mode');
		});
		
		// Remove dynamically created style elements
		const styleElements = document.querySelectorAll('style[id^="pretty-mermaid-theme-"]');
		styleElements.forEach((el) => el.remove());

		// Remove floating toolbars
		const toolbars = document.querySelectorAll('.pretty-mermaid-toolbar');
		toolbars.forEach((tb) => tb.remove());
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
				.addOption('adaptive', 'Obsidian Native (Adaptive)')
				.addOption('catppuccin', 'Catppuccin (Mocha & Latte)')
				.addOption('tokyo-night', 'Tokyo Night')
				.addOption('nord', 'Nordic Frost')
				.addOption('minimalist', 'Minimalist Studio')
				.addOption('classic', 'Classic (Legacy)')
				.addOption('monochrome', 'Monochrome (Legacy)')
				.setValue(this.plugin.settings.theme)
				.onChange(async (value) => {
					this.plugin.settings.theme = value as MermaidTheme;
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
			.setName('Flowchart Curve Style')
			.setDesc('Configure connection line curvature (smooth natural bezier curves vs angular or straight)')
			.addDropdown(dropdown => dropdown
				.addOption('natural', 'Natural (Smooth Bezier)')
				.addOption('basis', 'Basis (Organic Curves)')
				.addOption('cardinal', 'Cardinal (Rounded Corners)')
				.addOption('linear', 'Linear (Straight Lines)')
				.addOption('default', 'Default (Standard Mermaid)')
				.setValue(this.plugin.settings.flowchartCurve || 'natural')
				.onChange(async (value) => {
					this.plugin.settings.flowchartCurve = value as FlowchartCurve;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Interactive Diagram Toolbar')
			.setDesc('Display a floating glass toolbar on hover with zoom, copy, and fullscreen actions')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableToolbar)
				.onChange(async (value) => {
					this.plugin.settings.enableToolbar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Interactive Pan & Zoom')
			.setDesc('Enable mouse drag to pan and Ctrl/Cmd+scroll to zoom')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableZoom)
				.onChange(async (value) => {
					this.plugin.settings.enableZoom = value;
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

class MermaidFocusModal extends Modal {
	svg: SVGSVGElement;

	constructor(app: App, svg: SVGSVGElement) {
		super(app);
		this.svg = svg;
	}

	onOpen() {
		const { contentEl, modalEl } = this;
		modalEl.addClass('pretty-mermaid-focus-modal');
		contentEl.empty();
		contentEl.createEl('h3', { text: 'Diagram Focus View', cls: 'pretty-mermaid-focus-title' });

		const wrapper = contentEl.createDiv({ cls: 'pretty-mermaid-focus-content' });
		const clone = this.svg.cloneNode(true) as SVGSVGElement;
		clone.style.width = '100%';
		clone.style.height = '100%';
		clone.style.maxHeight = '75vh';
		clone.style.transform = 'none';
		wrapper.appendChild(clone);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
