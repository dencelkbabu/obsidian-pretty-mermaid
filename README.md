# Pretty Mermaid

Pretty Mermaid 🧜‍♀️ - Make your Mermaid diagrams actually pretty. Enhances Obsidian's default Mermaid rendering with better styling, colors, and smooth appearance. Because life's too short for ugly flowcharts.

## Features

- **Enhanced Styling**: Improved color schemes and typography for better readability
- **Multiple Themes**: Choose from Default, Professional, Colorful, or Minimal themes
- **Smart Sizing**: Fixes common cropping and sizing issues with Mermaid diagrams
- **Smooth Transitions**: Adds subtle animations and transitions for a polished look
- **Custom CSS Support**: Advanced users can add their own styling

## Installation

### Manual Installation
1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`)
2. Copy them to your vault's `.obsidian/plugins/pretty-mermaid/` folder
3. Enable the plugin in Obsidian's Community Plugins settings

### Development Installation
1. Clone this repository into your vault's `.obsidian/plugins/` folder
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Enable the plugin in Obsidian's settings

## Usage

1. Enable Pretty Mermaid in your plugin settings
2. Choose your preferred theme from the dropdown
3. Your existing Mermaid diagrams will automatically be enhanced!

## Development

This plugin uses the official Obsidian plugin template and follows modern TypeScript practices.

### Setup
```bash
# Install dependencies
npm install

# Start development with hot reload
npm run dev

# Build for production
npm run build
```

### Testing
We use Playwright for automated testing and visual regression testing.

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Run tests
npm run test:visual
npm run test:functional
```

See `DEVELOPMENT_PLAN.md` for our complete development roadmap.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have feature requests, please create an issue on our GitHub repository.