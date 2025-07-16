const { chromium } = require('playwright');

(async () => {
  console.log('Starting manual test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to test page...');
    await page.goto('http://localhost:3000');
    
    console.log('Waiting for mermaid to render...');
    await page.waitForTimeout(5000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'test-results/manual-test-screenshot.png', fullPage: true });
    
    console.log('Checking for plugin classes...');
    const mermaidElements = await page.$$('.mermaid');
    console.log(`Found ${mermaidElements.length} mermaid elements`);
    
    for (let i = 0; i < mermaidElements.length; i++) {
      const element = mermaidElements[i];
      const classes = await element.getAttribute('class');
      console.log(`Mermaid element ${i} classes:`, classes);
    }
    
    console.log('Checking for subgraph elements...');
    const subgraphElements = await page.$$('.mermaid .cluster rect');
    console.log(`Found ${subgraphElements.length} subgraph elements`);
    
    if (subgraphElements.length > 0) {
      const subgraph = subgraphElements[0];
      const fill = await subgraph.getAttribute('fill');
      const stroke = await subgraph.getAttribute('stroke');
      
      console.log('Subgraph fill:', fill);
      console.log('Subgraph stroke:', stroke);
    }
    
    console.log('Checking computed styles...');
    const styles = await page.evaluate(() => {
      const mermaidEl = document.querySelector('.mermaid');
      const subgraphEl = document.querySelector('.mermaid .cluster rect');
      
      return {
        mermaidClasses: mermaidEl ? mermaidEl.className : 'NOT_FOUND',
        subgraphFill: subgraphEl ? getComputedStyle(subgraphEl).fill : 'NOT_FOUND',
        subgraphStroke: subgraphEl ? getComputedStyle(subgraphEl).stroke : 'NOT_FOUND'
      };
    });
    
    console.log('Computed styles:', styles);
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();