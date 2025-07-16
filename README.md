# Pretty Mermaid

Pretty Mermaid 🧜‍♀️ - Make your Mermaid diagrams actually pretty. Enhances Obsidian's default Mermaid rendering with better styling, colors, and smooth appearance. Because life's too short for ugly flowcharts.

![Pretty Mermaid Plugin](https://img.shields.io/badge/version-1.0.0-blue.svg) ![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg) ![MIT License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Features

- **🎨 Two Beautiful Themes**: 
  - **Classic**: Official Mermaid colors with lavender and yellow nodes
  - **Monochrome**: Clean monochrome styling for business presentations
- **📱 Responsive Design**: Makes Mermaid diagrams fully responsive (unlike the default static sizing)
- **✨ Enhanced Styling**: Improved typography with authentic Trebuchet MS font
- **🔧 Smart Sizing**: Fixes common cropping and sizing issues with Mermaid diagrams  
- **🚀 Instant Application**: Works automatically on all existing Mermaid diagrams
- **⚙️ Simple Settings**: Easy theme switching with immediate preview
- **🎯 Zero Configuration**: Works perfectly out of the box

## 📸 Screenshots

*See `SHOWCASE.md` for complete examples with both themes!*

## 🚀 Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Pretty Mermaid"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`)
2. Copy them to your vault's `.obsidian/plugins/pretty-mermaid/` folder
3. Enable the plugin in Obsidian's Community Plugins settings

## 🎯 Usage

1. **Install & Enable**: The plugin works immediately after installation
2. **Choose Your Theme**: Go to Settings → Pretty Mermaid and select:
   - **Classic**: Official Mermaid styling with beautiful colors
   - **Monochrome**: Clean monochrome for business use
3. **Enjoy Beautiful Diagrams**: All your Mermaid diagrams are instantly enhanced!

### Example

Before Pretty Mermaid:
- Basic gray boxes with default fonts
- Poor contrast and readability
- Inconsistent styling
- **Static sizing that doesn't adapt to different screen sizes**

After Pretty Mermaid:
- Beautiful color schemes with proper contrast
- Professional typography with Trebuchet MS
- Consistent, polished appearance
- **Fully responsive diagrams that scale perfectly on any device**

## 🎨 Themes

### Classic Theme
- **Colors**: Official Mermaid lavender (#ECECFF) and yellow (#ffffde) nodes
- **Borders**: Elegant orchid (#9370DB) and olive (#aaaa33) accents
- **Style**: Authentic Mermaid appearance with enhanced readability

### Monochrome Theme  
- **Colors**: Clean monochrome with white and gray tones
- **Style**: Perfect for business presentations and professional documentation
- **Focus**: Maximum readability and minimal distraction

## 🛠️ Development

This plugin is built with modern TypeScript and follows Obsidian best practices.

### Quick Start
```bash
# Clone and setup
git clone https://github.com/calvinku/pretty-mermaid.git
cd pretty-mermaid
npm install

# Development with hot reload
npm run dev

# Build for production  
npm run build
```

### Testing
We use Playwright for automated visual regression testing:

```bash
# Install test dependencies
npm install -D @playwright/test
npx playwright install

# Run tests
npm run test:all
```

## 🤝 Contributing

We welcome contributions! Please see our development roadmap in `DEVELOPMENT_PLAN.md`.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the amazing [Obsidian](https://obsidian.md) community
- Uses official [Mermaid.js](https://mermaid.js.org) color schemes
- Created by [Calvin Ku](https://github.com/calvinku) & [Claude](https://claude.ai)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/calvinku/pretty-mermaid/issues)
- **Features**: [Feature Requests](https://github.com/calvinku/pretty-mermaid/issues/new)
- **Discussions**: [GitHub Discussions](https://github.com/calvinku/pretty-mermaid/discussions)

---

*Transform your Mermaid diagrams from functional to fantastic! ✨*