# JupyterLite Kernel Bridge - External Access Examples

With the kernel bridge modifications, you can now access and control running Pyodide kernels from outside the Web Worker environment.

## Browser Console Access

Once JupyterLite is running, open the browser developer console and try these commands:

### Basic Code Execution

```javascript
// Execute Python code in the active kernel
await jupyter.exec("print('Hello from browser console!')")

// Execute and display results
await jupyter.run("2 + 2")

// Execute with variables
await jupyter.exec("x = 42; print(f'The answer is {x}')")
```

### Kernel Management

```javascript
// List all running kernels
jupyter.kernels()

// Get active kernel info
jupyter.activeKernel()

// Execute in a specific kernel by ID
await jupyter.execIn("kernel-id-here", "print('Hello from specific kernel')")
```

### Variable Management

```javascript
// Set a variable from JavaScript
await jupyter.setVar("my_data", [1, 2, 3, 4, 5])

// Get a variable value
await jupyter.getVar("my_data")

// List all variables in kernel
await jupyter.listVars()

// Clear all variables
await jupyter.clearVars()
```

### Package Management

```javascript
// Install a Python package
await jupyter.install("numpy")

// Import a library
await jupyter.importLib("numpy", "np")

// Use the imported library
await jupyter.exec("arr = np.array([1, 2, 3, 4]); print(arr.sum())")
```

### Visualization

```javascript
// Create a simple plot
await jupyter.plot([1, 4, 2, 8, 5, 7], "My Data Plot")

// More complex visualization
await jupyter.exec(`
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Sine Wave')
plt.legend()
plt.grid(True)
plt.show()
`)
```

### Utility Functions

```javascript
// Get kernel statistics
await jupyter.stats()

// Get help for a Python object
await jupyter.help("print")

// Execute a notebook file
await jupyter.execFile("my_script.py")
```

### Shortcuts

```javascript
// Quick execution shortcuts
await jexec("print('Quick execution')")
await jrun("3 * 7")
jkernels() // No await needed for sync functions
```

## Programmatic Access

You can also access the lower-level bridge API:

```javascript
// Access the bridge directly
const bridge = window.jupyterKernelBridge;

// Get all running kernels
const kernels = bridge.getRunningKernels();
console.log(kernels);

// Execute with more control
const results = await bridge.executeCode(kernelId, "import sys; sys.version");

// Send raw Jupyter messages
bridge.sendMessage(kernelId, customMessage);
```

## JupyterLab Application Access

```javascript
// Access the full JupyterLab application
const app = window.jupyterapp;

// Get current notebook widget
const notebook = app.shell.currentWidget;

// Access the session and kernel
const session = notebook.sessionContext.session;
const kernel = session.kernel;
```

## Integration Examples

### 1. External Form Integration

```html
<button onclick="runPythonCode()">Run Analysis</button>

<script>
async function runPythonCode() {
    const code = `
    import pandas as pd
    import numpy as np
    
    # Create sample data
    data = np.random.randn(100, 2)
    df = pd.DataFrame(data, columns=['A', 'B'])
    
    # Perform analysis
    result = df.describe()
    print("Analysis complete!")
    result
    `;
    
    try {
        const results = await jupyter.exec(code);
        console.log("Analysis results:", results);
    } catch (error) {
        console.error("Analysis failed:", error);
    }
}
</script>
```

### 2. Real-time Data Injection

```javascript
// Inject real-time data into the kernel
async function injectData(data) {
    await jupyter.setVar("realtime_data", data);
    await jupyter.exec(`
        # Process the real-time data
        import pandas as pd
        df = pd.DataFrame(realtime_data)
        latest_value = df.iloc[-1]['value']
        print(f"Latest value: {latest_value}")
        
        # Update a plot if needed
        plt.clf()
        plt.plot(df['timestamp'], df['value'])
        plt.show()
    `);
}

// Example usage
setInterval(async () => {
    const data = {
        'timestamp': Date.now(),
        'value': Math.random() * 100
    };
    await injectData([data]);
}, 5000);
```

### 3. Bi-directional Communication

```javascript
// Set up a communication channel
await jupyter.exec(`
# Python side - define a callback
def send_to_js(message):
    # This would need additional bridge setup
    print(f"Python says: {message}")
    
global_state = {"counter": 0}
`);

// JavaScript side - periodic sync
async function syncState() {
    const counter = await jupyter.getVar("global_state['counter']");
    document.getElementById('counter').textContent = counter;
}

setInterval(syncState, 1000);
```

## Error Handling

```javascript
try {
    await jupyter.exec("undefined_variable")
} catch (error) {
    console.error("Python execution error:", error);
    // error object contains traceback and error details
}
```

## Performance Considerations

- Each `jupyter.exec()` call creates a new execution request
- Large data transfers between JS and Python may be slow
- Use batch operations when possible
- The Web Worker isolation still applies - shared memory is not available

## Security Notes

- This bridge provides full access to the Python kernel
- Be cautious when exposing this API in production environments
- User input should be sanitized before execution
- Consider implementing access controls if needed

## How It Works

The kernel bridge works by:

1. **Application Exposure**: JupyterLab app is exposed globally as `window.jupyterapp`
2. **Kernel Access**: Uses JupyterLab's public APIs to access running kernels
3. **Message Passing**: Leverages the existing WebSocket-like communication infrastructure
4. **Safe Execution**: Uses JupyterLab's `requestExecute()` API for code execution

## Implementation Details

The modifications include:

### Files Modified:
- `packages/kernel/src/bridge.ts` - Main kernel bridge implementation
- `packages/kernel/src/console-api.ts` - User-friendly console API
- `packages/kernel/src/index.ts` - Export new modules
- `packages/services-extension/src/index.ts` - Initialize bridge on startup
- `packages/application-extension/src/index.tsx` - Expose JupyterLab app globally

### Key Components:
1. **KernelBridge** - Core bridge for kernel access and code execution
2. **JupyterConsoleAPI** - Enhanced user-friendly API for browser console
3. **App Exposer Plugin** - Makes JupyterLab app accessible globally
4. **Auto-initialization** - Bridge starts automatically when JupyterLite loads

## Building the Modified JupyterLite

After making these changes, rebuild JupyterLite:

```bash
# Install dependencies
jlpm install
python -m pip install -r requirements-editable.txt

# Build the packages
jlpm build

# Build and serve the docs app
doit dev
doit serve:docs:app
```

Once running, the kernel bridge initializes automatically and you'll see:
```
JupyterLab application exposed globally
Initializing JupyterLite Kernel Bridge...
✓ Kernel Bridge and Console API ready
Try: jupyter.exec("print('Hello from browser console!')")
```

## Security Considerations

- This bridge provides full Python code execution access from the browser console
- Only use in trusted environments or development setups
- Consider implementing authentication/authorization for production use
- The Pyodide kernel still runs in a sandboxed Web Worker environment