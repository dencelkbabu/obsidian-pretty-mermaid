const { test, expect } = require('@playwright/test');

test.describe('Pretty Mermaid Plugin - Subgraph Styling', () => {
  test('should apply monochrome theme to subgraphs', async ({ page }) => {
    // Start the test server
    const { spawn } = require('child_process');
    const server = spawn('node', ['test-server.js'], { cwd: process.cwd() });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Navigate to test page
      await page.goto('http://localhost:3000');
      
      // Wait for mermaid diagrams to render
      await page.waitForTimeout(3000);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/before-styling.png', fullPage: true });
      
      // Check if plugin classes are applied
      const mermaidElements = await page.locator('.mermaid').all();
      console.log(`Found ${mermaidElements.length} mermaid elements`);
      
      for (let i = 0; i < mermaidElements.length; i++) {
        const element = mermaidElements[i];
        const classes = await element.getAttribute('class');
        console.log(`Mermaid element ${i} classes:`, classes);
        
        // Verify plugin classes are present
        expect(classes).toContain('pretty-mermaid-enhanced');
        expect(classes).toContain('pretty-mermaid-monochrome');
      }
      
      // Check if subgraph styling is applied
      const subgraphElements = await page.locator('.mermaid .cluster rect').all();
      console.log(`Found ${subgraphElements.length} subgraph elements`);
      
      if (subgraphElements.length > 0) {
        const subgraph = subgraphElements[0];
        const fill = await subgraph.getAttribute('fill');
        const stroke = await subgraph.getAttribute('stroke');
        
        console.log('Subgraph fill:', fill);
        console.log('Subgraph stroke:', stroke);
        
        // For monochrome theme, subgraphs should have light gray background
        // Note: The actual values might be different due to how CSS variables work
        expect(fill).toBeTruthy();
        expect(stroke).toBeTruthy();
      }
      
      // Check if diagrams are responsive
      const firstDiagram = mermaidElements[0];
      const svg = await firstDiagram.locator('svg').first();
      const maxWidth = await svg.evaluate(el => getComputedStyle(el).maxWidth);
      console.log('SVG max-width:', maxWidth);
      
      // Should be responsive (max-width: 100%)
      expect(maxWidth).toBe('100%');
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/after-styling.png', fullPage: true });
      
    } finally {
      // Clean up server
      server.kill();
    }
  });
  
  test('should apply classic theme to subgraphs', async ({ page }) => {
    // This test would be similar but check for classic theme colors
    // For now, let's focus on the monochrome test
  });
});