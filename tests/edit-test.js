const { chromium } = require('playwright');

(async () => {
  console.log('Starting edit scenario test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Opening test page...');
    await page.goto('file://' + __dirname + '/../test-edit-scenario.html');
    
    console.log('Waiting for initial load...');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/before-edit.png' });
    
    // Check initial styling
    const initialClasses = await page.evaluate(() => {
      const mermaidEl = document.querySelector('.mermaid');
      return mermaidEl ? mermaidEl.className : 'NOT_FOUND';
    });
    console.log('Initial classes:', initialClasses);
    
    // Click the simulate edit button
    console.log('Clicking simulate edit button...');
    await page.click('button');
    
    // Wait for the edit cycle to complete
    await page.waitForTimeout(2000);
    
    // Take screenshot after edit
    await page.screenshot({ path: 'test-results/after-edit.png' });
    
    // Check if styling was reapplied
    const finalClasses = await page.evaluate(() => {
      const mermaidEl = document.querySelector('.mermaid');
      return mermaidEl ? mermaidEl.className : 'NOT_FOUND';
    });
    console.log('Final classes:', finalClasses);
    
    // Check if subgraph styling is still applied
    const subgraphStyle = await page.evaluate(() => {
      const subgraphEl = document.querySelector('.mermaid .cluster rect');
      return subgraphEl ? {
        fill: getComputedStyle(subgraphEl).fill,
        stroke: getComputedStyle(subgraphEl).stroke
      } : 'NOT_FOUND';
    });
    console.log('Final subgraph style:', subgraphStyle);
    
    // Get the log content
    const logContent = await page.evaluate(() => {
      return document.getElementById('log').innerHTML;
    });
    console.log('Test log:\n', logContent);
    
    // Verify the fix worked
    if (finalClasses.includes('pretty-mermaid-enhanced') && 
        finalClasses.includes('pretty-mermaid-monochrome')) {
      console.log('✅ SUCCESS: Plugin classes were reapplied after edit!');
    } else {
      console.log('❌ FAILURE: Plugin classes were not reapplied after edit');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();