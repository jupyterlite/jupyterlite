# JupyterLite Kernel Bridge - Complete Guide

The kernel bridge allows you to access and control running Pyodide kernels from the browser console or external JavaScript, bypassing Web Worker isolation while maintaining security.

## Quick Start

Open JupyterLite, create/open a notebook, then open the browser developer console (F12):

```javascript
// Basic execution in active kernel
await jupyter.exec("print('Hello from browser console!')")
await jupyter.run("2 + 2")  // Shows formatted output

// Execute in specific notebook file
await jupyter.runInFile("Project.ipynb", "print('Hello from Project notebook!')")
```

## Core API Methods

### 1. **Active Kernel Execution**

```javascript
// Execute code in the currently active notebook/console
await jupyter.exec("x = 42; print(f'The answer is {x}')")

// Execute with pretty-printed results
await jupyter.run(`
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
print(f"Array: {arr}")
print(f"Sum: {arr.sum()}")
print(f"Mean: {arr.mean()}")
`)
```

### 2. **File-Based Execution** (New Feature)

The main enhancement - execute code in specific notebooks by filename:

```javascript
// Execute in a specific notebook
await jupyter.execInFile("DataAnalysis.ipynb", `
import pandas as pd
df = pd.read_csv('data.csv')
print(df.head())
`)

// Execute with formatted display
await jupyter.runInFile("Visualization.ipynb", `
import matplotlib.pyplot as plt
plt.figure(figsize=(10, 6))
plt.plot([1, 2, 3, 4, 5], [2, 4, 1, 8, 3])
plt.title('Sample Plot')
plt.show()
`)

// Works with any file type that has a running kernel
await jupyter.execInFile("script.py", "print('Hello from Python script!')")
```

### 3. **Python Kernel Fallback**

```javascript
// Execute in first available Python kernel (when no specific file target)
await jupyter.execInPython("import sys; print(sys.version)")
```

### 4. **Discovery and Management**

```javascript
// List all open files and their kernels
jupyter.listOpenFiles()
// Returns: [{ fileName: "Project.ipynb", fullPath: "/Project.ipynb", kernelId: "abc123", kernelName: "python3" }]

// List kernel sessions
jupyter.sessions()

// Get kernel info
jupyter.info()
```

## Data Transfer

For data transfer between JavaScript and Python, use direct execution:

```javascript
// Set variables in Python from JavaScript
const data = [1, 2, 3, 4, 5];
await jupyter.exec(`js_data = ${JSON.stringify(data)}`);

// Get variables from Python to JavaScript
const result = await jupyter.exec("my_result");  // Returns the variable value

// Set complex objects
const config = {name: "experiment", version: 1.2};
await jupyter.exec(`config = ${JSON.stringify(config)}`);
```

## Package Management

```javascript
// Install packages
await jupyter.install("pandas")
await jupyter.install("matplotlib")

// Import libraries (just use exec)
await jupyter.exec("import pandas as pd")
await jupyter.exec("import numpy as np")

// Use installed packages
await jupyter.run(`
df = pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]})
print(df.describe())
`)
```

## Multi-Notebook Workflows

### **Cross-Notebook Data Sharing**

```javascript
// Step 1: Load and process data in DataLoader.ipynb
await jupyter.runInFile("DataLoader.ipynb", `
import pandas as pd
raw_data = pd.read_csv('sales_data.csv')
print(f"Loaded {len(raw_data)} records")

# Clean and prepare data
cleaned_data = raw_data.dropna()
monthly_sales = cleaned_data.groupby('month').sum()
print("Data processing complete")
`)

// Step 2: Analyze in Analysis.ipynb (can access variables from DataLoader)
await jupyter.runInFile("Analysis.ipynb", `
# Access data processed in DataLoader notebook
correlation = cleaned_data.corr()
print("Correlation analysis:")
print(correlation)

# Create summary stats
summary = {
    'total_records': len(cleaned_data),
    'avg_sales': cleaned_data['sales'].mean(),
    'max_month': monthly_sales.idxmax()
}
print(f"Summary: {summary}")
`)

// Step 3: Visualize in Plotting.ipynb
await jupyter.runInFile("Plotting.ipynb", `
import matplotlib.pyplot as plt

plt.figure(figsize=(12, 8))
plt.subplot(2, 1, 1)
monthly_sales.plot(kind='bar')
plt.title('Monthly Sales')

plt.subplot(2, 1, 2)
correlation.plot(kind='heatmap')
plt.title('Correlation Matrix')

plt.tight_layout()
plt.show()
`)
```

## Streamlined API Summary

### **Essential Methods**
- `jupyter.exec(code)` - Execute in active kernel
- `jupyter.run(code)` - Execute with pretty display  
- `jupyter.execInFile(fileName, code)` - **NEW**: Execute in specific file
- `jupyter.runInFile(fileName, code)` - **NEW**: Execute in file with display
- `jupyter.execInPython(code)` - Execute in first Python kernel
- `jupyter.listOpenFiles()` - List available files and kernels
- `jupyter.install(package)` - Package installation
- `jupyter.execFile(path)` - Execute Python file from filesystem


## How It Works

The kernel bridge bypasses Web Worker isolation by:

1. **JupyterLab Integration**: Uses JupyterLab's public APIs instead of direct Worker access
2. **Session Discovery**: Finds kernels by matching file names to running sessions
3. **Safe Execution**: Uses `kernel.requestExecute()` which properly handles async execution
4. **Result Processing**: Captures all output types (text, HTML, images, errors)

## Setup Instructions

The kernel bridge is automatically initialized when JupyterLite loads. To build and run:

```bash
# Build with your modifications  
jlpm build

# Serve the development version
doit dev && doit serve:docs:app
```

Once running, open the browser console (F12) and you'll see:
```
JupyterLab application exposed globally
Initializing JupyterLite Kernel Bridge...
JupyterLite Console API initialized!
Available commands:
  jupyter.exec(code) - Execute Python code in active kernel
  jupyter.run(code) - Execute and display results  
  jupyter.execInFile("file.ipynb", code) - Execute in specific file
  jupyter.runInFile("file.ipynb", code) - Execute in file with display
  jupyter.execInPython(code) - Execute in first Python kernel
  jupyter.listOpenFiles() - List all open files with kernels
  jupyter.install(pkg) - Install Python package
  jupyter.execFile(path) - Execute Python file

Shortcuts: jexec(), jrun()
✓ Kernel Bridge and Console API ready
```

## Getting Started

1. **Open JupyterLite** in your browser
2. **Create or open a notebook** (e.g., `Project.ipynb`)  
3. **Open browser console** (F12 → Console tab)
4. **Start executing**:
   ```javascript
   jupyter.listOpenFiles()  // See available files
   await jupyter.execInFile("Project.ipynb", "print('Hello from console!')")
   ```

### **Console Tips**
- **Multi-line strings**: Use template literals with backticks `` ` ``
- **Copy-paste**: When pasting multi-line code, ensure all backticks are properly closed
- **Async execution**: Always use `await` for kernel execution methods
- **Error checking**: Check `jupyter.listOpenFiles()` if file not found errors occur

## Key Benefits

✅ **File-Based Targeting**: Execute code in specific notebooks by name  
✅ **Multi-Notebook Workflows**: Coordinate across multiple open notebooks  
✅ **External Control**: Browser console and JavaScript can control Pyodide kernels  
✅ **Safe Implementation**: Uses official JupyterLab APIs, won't break with updates  
✅ **Rich Output**: Supports all Jupyter output types (plots, HTML, errors)  
✅ **Simple & Focused**: Clean API with essential methods only  

This creates a powerful bridge that enables external JavaScript control of JupyterLite kernels while maintaining the security benefits of Web Worker isolation!