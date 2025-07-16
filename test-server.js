const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Pretty Mermaid Test</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin-bottom: 40px; }
        .mermaid { border: 1px solid #ccc; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Pretty Mermaid Plugin Test</h1>
    
    <div class="test-section">
        <h2>Test 1: Basic Subgraph (Should have light gray background for monochrome)</h2>
        <div class="mermaid">
graph TB
    subgraph "Frontend"
        A[React App]
        B[State Management]
    end
    
    subgraph "Backend"
        C[API Gateway]
        D[Authentication]
    end
    
    A --> C
    B --> A
        </div>
    </div>

    <div class="test-section">
        <h2>Test 2: Simple Flowchart (Should have responsive sizing)</h2>
        <div class="mermaid">
graph TD
    Start[Start] --> Process[Process Data]
    Process --> End[End]
        </div>
    </div>

    <div class="test-section">
        <h2>Test 3: Class Diagram</h2>
        <div class="mermaid">
classDiagram
    class Animal {
        +String name
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog
        </div>
    </div>

    <script>
        // Initialize mermaid first
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default'
        });
        
        // Wait for mermaid to render, then apply plugin styling
        window.addEventListener('load', () => {
            console.log('Page loaded, waiting for mermaid to render...');
            
            setTimeout(() => {
                console.log('Applying plugin styling...');
                
                // Simulate plugin behavior - add classes and inject CSS
                const mermaidElements = document.querySelectorAll('.mermaid');
                mermaidElements.forEach(el => {
                    el.classList.add('pretty-mermaid-enhanced');
                    el.classList.add('pretty-mermaid-monochrome'); // Test monochrome theme
                });
                
                // Inject the theme CSS like the plugin does
                const themeVars = {
                    primaryColor: '#ffffff',
                    primaryTextColor: '#374151',
                    primaryBorderColor: '#6b7280',
                    lineColor: '#9ca3af',
                    clusterBkg: '#f3f4f6',
                    clusterBorder: '#6b7280',
                    actorBkg: '#ffffff',
                    actorBorder: '#6b7280'
                };
                
                const css = \`
                    .pretty-mermaid-monochrome {
                        --mermaid-cluster-bkg: \${themeVars.clusterBkg};
                        --mermaid-cluster-border: \${themeVars.clusterBorder};
                        --mermaid-primary-color: \${themeVars.primaryColor};
                        --mermaid-primary-border-color: \${themeVars.primaryBorderColor};
                        --mermaid-line-color: \${themeVars.lineColor};
                        
                        border-radius: 8px;
                        padding: 16px;
                        margin: 16px 0;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        background: #f9fafb !important;
                        border: 1px solid #d1d5db;
                    }
                    
                    .pretty-mermaid-monochrome svg {
                        max-width: 100%;
                        height: auto;
                        display: block;
                        margin: 0 auto;
                    }
                    
                    .pretty-mermaid-monochrome .cluster rect {
                        fill: var(--mermaid-cluster-bkg) !important;
                        stroke: var(--mermaid-cluster-border) !important;
                        stroke-width: 2px !important;
                    }
                    
                    .pretty-mermaid-monochrome .node rect,
                    .pretty-mermaid-monochrome .node circle,
                    .pretty-mermaid-monochrome .node ellipse,
                    .pretty-mermaid-monochrome .node polygon {
                        fill: var(--mermaid-primary-color) !important;
                        stroke: var(--mermaid-primary-border-color) !important;
                        stroke-width: 1px !important;
                    }
                    
                    .pretty-mermaid-monochrome .edgePath .path {
                        stroke: var(--mermaid-line-color) !important;
                        stroke-width: 1px !important;
                    }
                \`;
                
                const styleElement = document.createElement('style');
                styleElement.textContent = css;
                document.head.appendChild(styleElement);
                
                console.log('Added plugin classes and CSS to', mermaidElements.length, 'diagrams');
            }, 1000); // Wait 1 second for mermaid to render
        });
    </script>
</body>
</html>
    `);
  } else if (req.url === '/styles.css') {
    const cssPath = path.join(__dirname, 'styles.css');
    if (fs.existsSync(cssPath)) {
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(fs.readFileSync(cssPath));
    } else {
      res.writeHead(404);
      res.end('CSS file not found');
    }
  } else if (req.url === '/main.js') {
    const jsPath = path.join(__dirname, 'main.js');
    if (fs.existsSync(jsPath)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(fs.readFileSync(jsPath));
    } else {
      res.writeHead(404);
      res.end('JS file not found');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});