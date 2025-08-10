# Integrating JupyterLite with Kernel Bridge in React/Next.js Projects

This guide shows how to integrate the enhanced JupyterLite with kernel bridge functionality into your React or Next.js applications, enabling external control of Python kernels from your web application.

## Table of Contents
- [Building and Deploying JupyterLite](#building-and-deploying-jupyterlite)
- [React Integration](#react-integration)
- [Next.js Integration](#nextjs-integration)
- [Advanced Usage Examples](#advanced-usage-examples)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Building and Deploying JupyterLite

### Step 1: Build Your Custom JupyterLite

First, build your custom JupyterLite with the kernel bridge:

```bash
# In your jupyterlite directory
cd /path/to/your/jupyterlite

# Install dependencies
jlpm install

# Build the project
jlpm build

# Generate the JupyterLite site
doit build

# The built site will be in _output/
ls _output/
```

### Step 2: Deploy JupyterLite

You have several options for deployment:

#### Option A: Static File Hosting
```bash
# Copy the _output directory to your web server
cp -r _output/* /var/www/html/jupyterlite/

# Or use a static hosting service like Netlify, Vercel, etc.
# Just upload the _output folder contents
```

#### Option B: Serve Locally for Development
```bash
# Serve for development
doit serve

# Or use Python's built-in server
cd _output
python -m http.server 8000
```

#### Option C: Integrate with Your Build Process
```bash
# Add to your CI/CD pipeline
# Example GitHub Actions workflow
name: Build JupyterLite
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build JupyterLite
        run: |
          jlpm install
          jlpm build
          doit build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_output
```

## React Integration

### Step 1: Create React Component for JupyterLite

```jsx
// components/JupyterLiteFrame.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

const JupyterLiteFrame = ({ 
  src = "http://localhost:8000", // Your JupyterLite URL
  onKernelReady,
  className = "w-full h-96 border rounded"
}) => {
  const iframeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [jupyter, setJupyter] = useState(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        // Access the jupyter API from the iframe
        const iframeWindow = iframe.contentWindow;
        const jupyterAPI = iframeWindow.jupyter;
        
        if (jupyterAPI) {
          setJupyter(jupyterAPI);
          setIsReady(true);
          onKernelReady?.(jupyterAPI);
          console.log('🚀 JupyterLite kernel bridge ready!');
        } else {
          // Wait a bit longer for the API to initialize
          setTimeout(handleLoad, 1000);
        }
      } catch (error) {
        console.warn('Waiting for JupyterLite to initialize...', error.message);
        setTimeout(handleLoad, 2000);
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [onKernelReady]);

  return (
    <div className="relative">
      <iframe
        ref={iframeRef}
        src={src}
        className={className}
        title="JupyterLite"
        allow="cross-origin-isolated"
      />
      {!isReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading JupyterLite...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JupyterLiteFrame;
```

### Step 2: Create Kernel Controller Hook

```jsx
// hooks/useJupyterKernel.js
import { useState, useCallback } from 'react';

export const useJupyterKernel = () => {
  const [jupyter, setJupyter] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const handleKernelReady = useCallback((jupyterAPI) => {
    setJupyter(jupyterAPI);
  }, []);

  const executeCode = useCallback(async (code, fileName = null) => {
    if (!jupyter) {
      setError('Jupyter kernel not ready');
      return null;
    }

    setIsExecuting(true);
    setError(null);

    try {
      let result;
      if (fileName) {
        result = await jupyter.execInFile(fileName, code);
      } else {
        result = await jupyter.exec(code);
      }
      
      setLastResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [jupyter]);

  const runCode = useCallback(async (code, fileName = null) => {
    if (!jupyter) {
      setError('Jupyter kernel not ready');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      if (fileName) {
        await jupyter.runInFile(fileName, code);
      } else {
        await jupyter.run(code);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [jupyter]);

  const listFiles = useCallback(() => {
    if (!jupyter) return [];
    return jupyter.listOpenFiles();
  }, [jupyter]);

  const installPackage = useCallback(async (packageName) => {
    if (!jupyter) {
      setError('Jupyter kernel not ready');
      return null;
    }

    setIsExecuting(true);
    try {
      const result = await jupyter.install(packageName);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [jupyter]);

  return {
    jupyter,
    isReady: !!jupyter,
    isExecuting,
    lastResult,
    error,
    handleKernelReady,
    executeCode,
    runCode,
    listFiles,
    installPackage
  };
};
```

### Step 3: Create Interactive Dashboard Component

```jsx
// components/JupyterDashboard.jsx
import React, { useState } from 'react';
import JupyterLiteFrame from './JupyterLiteFrame';
import { useJupyterKernel } from '../hooks/useJupyterKernel';

const JupyterDashboard = () => {
  const {
    isReady,
    isExecuting,
    error,
    handleKernelReady,
    executeCode,
    runCode,
    listFiles,
    installPackage
  } = useJupyterKernel();

  const [code, setCode] = useState('print("Hello from React!")');
  const [selectedFile, setSelectedFile] = useState('');
  const [packageName, setPackageName] = useState('');
  const [files, setFiles] = useState([]);

  const refreshFiles = () => {
    const fileList = listFiles();
    setFiles(fileList);
  };

  const handleExecute = async () => {
    try {
      if (selectedFile) {
        await runCode(code, selectedFile);
      } else {
        await runCode(code);
      }
    } catch (err) {
      console.error('Execution failed:', err);
    }
  };

  const handleInstall = async () => {
    if (!packageName.trim()) return;
    
    try {
      await installPackage(packageName);
      console.log(`Package ${packageName} installed successfully`);
      setPackageName('');
    } catch (err) {
      console.error('Installation failed:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* JupyterLite Frame */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">JupyterLite</h2>
        <JupyterLiteFrame 
          onKernelReady={handleKernelReady}
          className="w-full h-96 border rounded"
        />
      </div>

      {/* Control Panel */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Control Panel</h2>
        
        {/* Status */}
        <div className="p-4 rounded bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isReady ? 'Kernel Ready' : 'Kernel Not Ready'}
            </span>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* File Selection */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={refreshFiles}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Refresh Files
            </button>
          </div>
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Execute in active kernel</option>
            {files.map((file, index) => (
              <option key={index} value={file.fileName}>
                {file.fileName} ({file.kernelName})
              </option>
            ))}
          </select>
        </div>

        {/* Code Execution */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Python Code:</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-32 p-2 border rounded font-mono text-sm"
            placeholder="Enter Python code here..."
          />
          <button
            onClick={handleExecute}
            disabled={!isReady || isExecuting}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? 'Executing...' : 'Execute Code'}
          </button>
        </div>

        {/* Package Installation */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Install Package:</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g., pandas, numpy"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleInstall}
              disabled={!isReady || isExecuting || !packageName.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Install
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Quick Actions:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => runCode('import sys; print(sys.version)')}
              disabled={!isReady || isExecuting}
              className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              Check Python Version
            </button>
            <button
              onClick={() => runCode('import numpy as np; print("NumPy version:", np.__version__)')}
              disabled={!isReady || isExecuting}
              className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              Check NumPy
            </button>
            <button
              onClick={() => runCode('print(list(globals().keys())[:10])')}
              disabled={!isReady || isExecuting}
              className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              List Variables
            </button>
            <button
              onClick={() => runCode(`
import matplotlib.pyplot as plt
import numpy as np
x = np.linspace(0, 10, 100)
y = np.sin(x)
plt.figure(figsize=(8, 4))
plt.plot(x, y)
plt.title('Sine Wave')
plt.show()
              `)}
              disabled={!isReady || isExecuting}
              className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              Plot Sine Wave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JupyterDashboard;
```

## Next.js Integration

### Step 1: Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Allow iframe embedding from your JupyterLite domain
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ],
      },
    ]
  },

  // If serving JupyterLite from the same domain
  async rewrites() {
    return [
      {
        source: '/jupyterlite/:path*',
        destination: 'http://localhost:8000/:path*', // Your JupyterLite server
      },
    ]
  },
}

module.exports = nextConfig
```

### Step 2: Create Next.js Page

```jsx
// pages/jupyter.js
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import to avoid SSR issues
const JupyterDashboard = dynamic(() => import('../components/JupyterDashboard'), {
  ssr: false,
  loading: () => <div className="p-8">Loading JupyterLite Dashboard...</div>
});

export default function JupyterPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>JupyterLite Dashboard</title>
        <meta name="description" content="Interactive Python environment with JupyterLite" />
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              🐍 Python Data Science Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Interactive Python environment powered by JupyterLite and Pyodide
            </p>
          </div>
        </header>
        
        <main>
          <JupyterDashboard />
        </main>
      </div>
    </>
  );
}
```

### Step 3: API Routes for Server-Side Integration

```javascript
// pages/api/jupyter/execute.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, fileName } = req.body;

  try {
    // Here you could log executions, validate code, etc.
    console.log('Executing code:', code);
    
    // Return success - actual execution happens on client side
    res.status(200).json({ 
      success: true, 
      message: 'Code queued for execution' 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
}

// pages/api/jupyter/files.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // You could maintain a server-side registry of files
    const files = [
      { name: 'analysis.ipynb', type: 'notebook' },
      { name: 'data.csv', type: 'data' }
    ];
    
    res.status(200).json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Advanced Usage Examples

### Multi-Notebook Data Pipeline

```jsx
// components/DataPipeline.jsx
import React, { useState } from 'react';
import { useJupyterKernel } from '../hooks/useJupyterKernel';

const DataPipeline = () => {
  const { runCode, isExecuting } = useJupyterKernel();
  const [pipelineStatus, setPipelineStatus] = useState({});

  const runPipeline = async () => {
    const steps = [
      {
        name: 'Data Loading',
        file: 'loader.ipynb',
        code: `
import pandas as pd
import numpy as np
data = pd.read_csv('/data/sales.csv')
print(f"Loaded {len(data)} records")
        `
      },
      {
        name: 'Data Processing',
        file: 'processor.ipynb',
        code: `
# Clean and process data
clean_data = data.dropna()
processed_data = clean_data.groupby('category').sum()
print("Data processing complete")
        `
      },
      {
        name: 'Visualization',
        file: 'visualizer.ipynb',
        code: `
import matplotlib.pyplot as plt
plt.figure(figsize=(12, 6))
processed_data.plot(kind='bar')
plt.title('Sales by Category')
plt.show()
        `
      }
    ];

    for (const step of steps) {
      setPipelineStatus(prev => ({ 
        ...prev, 
        [step.name]: 'running' 
      }));

      try {
        await runCode(step.code, step.file);
        setPipelineStatus(prev => ({ 
          ...prev, 
          [step.name]: 'completed' 
        }));
      } catch (error) {
        setPipelineStatus(prev => ({ 
          ...prev, 
          [step.name]: 'error' 
        }));
        break;
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Data Pipeline</h3>
      
      <button
        onClick={runPipeline}
        disabled={isExecuting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Run Pipeline
      </button>

      <div className="space-y-2">
        {Object.entries(pipelineStatus).map(([step, status]) => (
          <div key={step} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'completed' ? 'bg-green-500' :
              status === 'running' ? 'bg-yellow-500' :
              status === 'error' ? 'bg-red-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-sm">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataPipeline;
```

### Real-time Data Streaming

```jsx
// components/DataStreamer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useJupyterKernel } from '../hooks/useJupyterKernel';

const DataStreamer = () => {
  const { runCode, isReady } = useJupyterKernel();
  const [isStreaming, setIsStreaming] = useState(false);
  const [dataPoints, setDataPoints] = useState(0);
  const intervalRef = useRef(null);

  const generateData = () => {
    return Array.from({ length: 10 }, () => Math.random() * 100);
  };

  const startStreaming = async () => {
    if (!isReady) return;

    setIsStreaming(true);
    
    // Initialize streaming in Python
    await runCode(`
import matplotlib.pyplot as plt
import numpy as np
from collections import deque

# Initialize data buffer
data_buffer = deque(maxlen=100)

def update_plot(new_data):
    data_buffer.extend(new_data)
    
    plt.clf()
    plt.plot(list(data_buffer), 'b-', alpha=0.7)
    plt.title(f'Live Data Stream ({len(data_buffer)} points)')
    plt.xlabel('Time')
    plt.ylabel('Value')
    plt.grid(True)
    plt.show()

print("Streaming initialized")
    `, 'streaming.ipynb');

    // Start streaming data
    intervalRef.current = setInterval(async () => {
      const newData = generateData();
      setDataPoints(prev => prev + newData.length);
      
      await runCode(`
new_data = ${JSON.stringify(newData)}
update_plot(new_data)
print(f"Updated with {len(new_data)} new points")
      `, 'streaming.ipynb');
    }, 2000);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Real-time Data Streaming</h3>
      
      <div className="flex space-x-2">
        <button
          onClick={startStreaming}
          disabled={!isReady || isStreaming}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Start Streaming
        </button>
        
        <button
          onClick={stopStreaming}
          disabled={!isStreaming}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Stop Streaming
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Status: {isStreaming ? 'Streaming' : 'Stopped'} | 
        Data points: {dataPoints}
      </div>
    </div>
  );
};

export default DataStreamer;
```

## Production Deployment

### Step 1: Build for Production

```bash
# Build JupyterLite
cd /path/to/jupyterlite
jlpm build
doit build

# Build React/Next.js app
cd /path/to/react-app
npm run build
```

### Step 2: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

# Build JupyterLite
WORKDIR /app/jupyterlite
COPY jupyterlite/package.json jupyterlite/yarn.lock ./
RUN yarn install
COPY jupyterlite/ ./
RUN yarn build && doit build

# Build React app
WORKDIR /app/react
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/jupyterlite/_output /usr/share/nginx/html/jupyterlite
COPY --from=builder /app/react/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 3: Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    
    # Serve React app
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Serve JupyterLite
    location /jupyterlite/ {
        root /usr/share/nginx/html;
        
        # Required for SharedArrayBuffer
        add_header Cross-Origin-Embedder-Policy require-corp;
        add_header Cross-Origin-Opener-Policy same-origin;
    }
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Step 4: Environment Configuration

```javascript
// config/environment.js
const config = {
  development: {
    jupyterliteUrl: 'http://localhost:8000',
    apiUrl: 'http://localhost:3000/api'
  },
  production: {
    jupyterliteUrl: '/jupyterlite',
    apiUrl: '/api'
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## Troubleshooting

### Common Issues and Solutions

#### 1. **Cross-Origin Issues**
```javascript
// Solution: Add proper headers in your Next.js config
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp'
        }
      ],
    },
  ]
}
```

#### 2. **Iframe Communication Blocked**
```javascript
// Solution: Ensure same-origin or proper CORS setup
const iframe = document.getElementById('jupyter-frame');
try {
  const jupyterAPI = iframe.contentWindow.jupyter;
} catch (error) {
  console.log('Use postMessage API instead');
}
```

#### 3. **SharedArrayBuffer Not Available**
```html
<!-- Add these headers for SharedArrayBuffer support -->
<meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp">
<meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
```

#### 4. **Kernel Not Ready**
```javascript
// Solution: Add proper initialization checks
const waitForKernel = async (maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      if (window.jupyter && window.jupyter.listOpenFiles) {
        return window.jupyter;
      }
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Kernel failed to initialize');
};
```

### Performance Optimization

1. **Lazy Loading**: Load JupyterLite only when needed
2. **Code Splitting**: Split kernel bridge code into separate chunks
3. **Caching**: Cache JupyterLite build artifacts
4. **Compression**: Enable gzip/brotli compression

### Security Considerations

1. **Code Execution**: Validate/sanitize code before execution
2. **File Access**: Restrict file system access
3. **Network Access**: Control package installation permissions
4. **Content Security Policy**: Implement proper CSP headers

## Example Complete Integration

Here's a complete example that puts it all together:

```jsx
// pages/data-science.js
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import JupyterDashboard from '../components/JupyterDashboard';
import DataPipeline from '../components/DataPipeline';
import DataStreamer from '../components/DataStreamer';

const DataSciencePage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', component: JupyterDashboard },
    { id: 'pipeline', label: 'Data Pipeline', component: DataPipeline },
    { id: 'streaming', label: 'Live Streaming', component: DataStreamer }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || JupyterDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6">
        <ActiveComponent />
      </main>
    </div>
  );
};

export default DataSciencePage;
```

This integration provides a powerful platform for data science applications with full Python kernel control from your React/Next.js frontend!