# Pretty Mermaid Plugin Development Plan

## Project Overview
Pretty Mermaid is an Obsidian plugin that enhances Mermaid diagram rendering with better styling, colors, and smooth appearance. This document outlines our development approach using automated testing with Playwright.

## Development Philosophy
**Cycle-based Development**: Develop → Auto-Verify → Manual Review (if needed) → Fix

Each cycle focuses on a specific feature set with automated verification to ensure quality and prevent regressions.

---

## Development Cycles

### **Cycle 1: Foundation & Setup**
**Goal**: Get basic plugin structure working in Obsidian with testing framework

**Develop**:
- Set up Obsidian plugin project structure using official template
- Create basic plugin scaffold with TypeScript
- Set up Playwright testing framework
- Configure development environment with hot reload
- Create test vault with sample Mermaid diagrams

**Auto-Verify**:
- Plugin loads in Obsidian without errors
- Basic plugin appears in settings
- Development workflow (npm run dev) works
- Playwright can launch Obsidian and take screenshots

**Manual Review**: Verify plugin shows up in Obsidian settings

**Fix**: Address any TypeScript compilation, loading, or test setup issues

---

### **Cycle 2: Mermaid Detection & Injection**
**Goal**: Identify and target Mermaid diagrams in Obsidian

**Develop**:
- Hook into Obsidian's markdown post-processor
- Detect Mermaid code blocks and rendered diagrams
- Create basic CSS injection system
- Add visual regression tests for diagram detection

**Auto-Verify**:
- Plugin successfully detects Mermaid diagrams
- Can inject custom CSS without breaking existing functionality
- No performance impact on non-Mermaid content
- Screenshots show proper diagram rendering

**Manual Review**: Verify detection works across different diagram types

**Fix**: Refine detection logic and CSS injection timing

---

### **Cycle 3: Basic Styling Improvements**
**Goal**: Implement core visual enhancements

**Develop**:
- Create improved color schemes (better than default)
- Fix common sizing/cropping issues
- Add smooth transitions and better typography
- Expand test coverage for visual changes

**Auto-Verify**:
- Visual regression tests pass for improved styling
- No layout breaking or text readability issues
- Works across different Obsidian themes (light/dark)
- Performance tests show no significant slowdown

**Manual Review**: Compare before/after screenshots for visual quality

**Fix**: Adjust colors and sizing for edge cases

---

### **Cycle 4: Advanced Styling Features**
**Goal**: Add sophisticated styling options

**Develop**:
- Multiple preset themes (professional, colorful, minimal)
- Dynamic sizing controls
- Better alignment options
- Theme-specific visual regression tests

**Auto-Verify**:
- Theme switching works seamlessly
- Diagrams scale properly in different contexts
- Maintains compatibility with Obsidian's responsive design
- All theme presets pass visual tests

**Manual Review**: Test theme switching user experience

**Fix**: Refine theme consistency and responsive behavior

---

### **Cycle 5: User Configuration**
**Goal**: Make it customizable for users

**Develop**:
- Settings panel for theme selection
- Toggle for enabling/disabling features
- Custom CSS override options
- Tests for settings persistence and UI

**Auto-Verify**:
- Settings persist across Obsidian restarts
- Changes apply immediately without reload
- Settings UI renders correctly
- All configuration options work as expected

**Manual Review**: Test settings panel usability

**Fix**: Improve settings UX and add validation

---

### **Cycle 6: Polish & Distribution**
**Goal**: Prepare for public release

**Develop**:
- Performance optimization
- Error handling and edge cases
- Documentation and README
- Comprehensive test suite

**Auto-Verify**:
- Works across different Obsidian versions
- No memory leaks or performance issues
- All edge cases handled gracefully
- Full test coverage passes

**Manual Review**: Final user experience testing

**Fix**: Final bug fixes and optimization

---

## Playwright Testing Framework

### **Test Structure**
```
tests/
├── fixtures/
│   ├── sample-diagrams.md    # Test Mermaid diagrams
│   └── test-vault/           # Minimal Obsidian vault
├── visual/
│   ├── baseline/             # Golden screenshots
│   └── screenshots/          # Current test screenshots
└── specs/
    ├── visual-regression.spec.ts
    └── functionality.spec.ts
```

### **Test Types**

**Visual Regression Testing**:
- Screenshot comparison of Mermaid diagrams
- Before/after styling changes
- Cross-theme compatibility
- Different diagram types and sizes

**Functional Testing**:
- Plugin loading and initialization
- Settings changes and persistence
- CSS injection and removal
- Performance impact measurement

**Test Scenarios**:
- Flowchart diagrams
- Sequence diagrams
- Gantt charts
- Class diagrams
- Light/dark theme compatibility
- Various diagram complexities

### **Automation Commands**
```bash
# Development
npm run dev                    # Hot reload development
npm run build                  # Build plugin

# Testing
npm run test:visual           # Run visual regression tests
npm run test:functional       # Run functionality tests
npm run test:all              # Run all tests
npm run test:update           # Update visual baselines

# CI/CD
npm run test:ci               # Run tests in CI environment
```

### **Development Workflow**

1. **Make Changes**: Edit plugin code
2. **Auto-Verify**: Run `npm run test:visual`
3. **Review Results**: 
   - ✅ Tests pass → Continue development
   - ❌ Tests fail → Review diff images
4. **Update Baselines**: If changes are intentional
5. **Manual Check**: Only when tests fail or for final review

### **CI/CD Integration**
- Run tests on every commit
- Block merges if visual regressions detected
- Automatically update screenshots for approved changes
- Performance monitoring and reporting

---

## Technical Architecture

### **Plugin Structure**
- **Main Plugin Class**: Core plugin logic and lifecycle
- **Mermaid Processor**: Detect and enhance Mermaid diagrams
- **Style Manager**: Handle CSS injection and theme switching
- **Settings Manager**: User configuration and persistence

### **Key Technologies**
- **TypeScript**: Type-safe plugin development
- **Obsidian API**: Plugin integration and hooks
- **Playwright**: Automated testing and visual regression
- **CSS**: Styling enhancements and themes

### **Common Issues Addressed**
- Diagram cropping and sizing problems
- Poor default color schemes
- Lack of alignment options
- Inconsistent styling across themes
- Performance impact on large documents

---

## Success Metrics

### **Quality Metrics**
- All visual regression tests pass
- No performance degradation > 5%
- Zero crashes or errors in normal usage
- Cross-theme compatibility maintained

### **User Experience Metrics**
- Improved diagram readability
- Consistent styling across themes
- Intuitive settings interface
- Smooth transitions and animations

### **Development Metrics**
- Automated test coverage > 90%
- Build time < 10 seconds
- Test execution time < 2 minutes
- Zero manual verification needed for routine changes

---

## Maintenance Plan

### **Regular Updates**
- Test new Obsidian versions for compatibility
- Update Playwright and dependencies
- Add new Mermaid diagram types as they're released
- Refresh visual baselines for Obsidian theme updates

### **Monitoring**
- Performance regression detection
- Error reporting and analytics
- User feedback integration
- Automated dependency updates

---

## Notes and Decisions

### **Technology Choices**
- **Playwright over Spectron**: Spectron is deprecated, Playwright is actively maintained
- **TypeScript**: Better development experience and type safety
- **Visual Regression**: Automated verification reduces manual testing burden

### **Development Approach**
- **Cycle-based**: Manageable increments with clear verification
- **Test-first**: Automated testing prevents regressions
- **Performance-conscious**: Monitor impact on Obsidian performance

---

*This plan will be updated as we progress through development cycles and learn more about the technical requirements.*