/**
 * Browser Console API for JupyterLite Kernel Access
 */

import { getKernelBridge } from './bridge';

/**
 * Console API interface for easy kernel interaction
 */
export interface IJupyterConsoleAPI {
  /**
   * Execute Python code in the active kernel
   */
  exec(code: string): Promise<any>;
  
  /**
   * Execute code in a specific kernel by ID
   */
  execIn(kernelId: string, code: string): Promise<any>;
  
  /**
   * List all running kernels
   */
  kernels(): { [kernelId: string]: any };
  
  /**
   * Get active kernel info
   */
  activeKernel(): any;
  
  /**
   * Execute code and log the result to console
   */
  run(code: string): Promise<void>;
  
  /**
   * Import a library in the active kernel
   */
  importLib(library: string, alias?: string): Promise<any>;
  
  /**
   * Get variables from kernel namespace
   */
  getVar(varName: string): Promise<any>;
  
  /**
   * Set a variable in kernel namespace
   */
  setVar(varName: string, value: any): Promise<any>;
  
  /**
   * Install a package via micropip
   */
  install(packageName: string): Promise<any>;
}

/**
 * Implementation of the console API
 */
class JupyterConsoleAPI implements IJupyterConsoleAPI {
  protected get bridge() {
    const bridge = getKernelBridge();
    if (!bridge) {
      throw new Error('Kernel bridge not initialized. Make sure JupyterLite is running.');
    }
    return bridge;
  }

  private getActiveKernelId(): string {
    const activeKernelId = this.bridge.getActiveKernel();
    if (!activeKernelId) {
      throw new Error('No active kernel found. Open a notebook first.');
    }
    return activeKernelId;
  }

  async exec(code: string): Promise<any> {
    const kernelId = this.getActiveKernelId();
    return this.bridge.executeCode(kernelId, code);
  }

  async execIn(kernelId: string, code: string): Promise<any> {
    return this.bridge.executeCode(kernelId, code);
  }

  kernels(): { [kernelId: string]: any } {
    return this.bridge.getRunningKernels();
  }

  activeKernel(): any {
    const kernelId = this.getActiveKernelId();
    const kernels = this.bridge.getRunningKernels();
    return kernels[kernelId] || null;
  }

  async run(code: string): Promise<void> {
    try {
      const results = await this.exec(code);
      console.log('Execution results:', results);
      
      // Display results in a formatted way
      results.forEach((result: any, index: number) => {
        console.group(`Output ${index + 1}:`);
        
        if (result.output_type === 'stream') {
          console.log(`[${result.name}]`, result.text);
        } else if (result.output_type === 'execute_result' || result.output_type === 'display_data') {
          if (result.data) {
            if (result.data['text/plain']) {
              console.log('Result:', result.data['text/plain']);
            }
            if (result.data['text/html']) {
              console.log('HTML:', result.data['text/html']);
            }
            if (result.data['image/png']) {
              console.log('Image (base64):', result.data['image/png'].substring(0, 50) + '...');
            }
          }
        }
        
        console.groupEnd();
      });
    } catch (error) {
      console.error('Execution failed:', error);
    }
  }

  async importLib(library: string, alias?: string): Promise<any> {
    const importCode = alias 
      ? `import ${library} as ${alias}` 
      : `import ${library}`;
    return this.exec(importCode);
  }

  async getVar(varName: string): Promise<any> {
    const results = await this.exec(varName);
    return results.length > 0 ? results[0] : null;
  }

  async setVar(varName: string, value: any): Promise<any> {
    let code: string;
    if (typeof value === 'string') {
      code = `${varName} = "${value}"`;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      code = `${varName} = ${value}`;
    } else {
      code = `${varName} = ${JSON.stringify(value)}`;
    }
    return this.exec(code);
  }

  async install(packageName: string): Promise<any> {
    const installCode = `
import micropip
await micropip.install("${packageName}")
print(f"Successfully installed {packageName}")
`;
    return this.exec(installCode);
  }
}

/**
 * Enhanced console API with additional utilities
 */
class JupyterConsoleAPIExtended extends JupyterConsoleAPI {
  /**
   * Get kernel memory usage and stats
   */
  async stats(): Promise<any> {
    const code = `
import sys
import os
import psutil

stats = {
    'python_version': sys.version,
    'platform': sys.platform,
    'memory_usage': sys.getsizeof(globals()),
    'modules_loaded': len(sys.modules),
    'current_directory': os.getcwd() if hasattr(os, 'getcwd') else 'N/A'
}
stats
`;
    return this.exec(code);
  }

  /**
   * List all variables in the kernel namespace
   */
  async listVars(): Promise<any> {
    const code = `
import sys
vars_info = {}
for name, obj in globals().items():
    if not name.startswith('_'):
        vars_info[name] = {
            'type': type(obj).__name__,
            'size': sys.getsizeof(obj),
            'value_preview': str(obj)[:100] + ('...' if len(str(obj)) > 100 else '')
        }
vars_info
`;
    return this.exec(code);
  }

  /**
   * Clear all user-defined variables
   */
  async clearVars(): Promise<any> {
    const code = `
# Get list of user variables to clear
user_vars = [name for name in globals() if not name.startswith('_') and name not in ['In', 'Out', 'get_ipython', 'quit', 'exit']]
cleared_count = len(user_vars)

# Clear them
for var in user_vars:
    del globals()[var]
    
print(f"Cleared {cleared_count} variables")
cleared_count
`;
    return this.exec(code);
  }

  /**
   * Execute a file from the JupyterLite filesystem
   */
  async execFile(filePath: string): Promise<any> {
    const code = `
with open("${filePath}", "r") as f:
    exec(f.read())
print(f"Executed file: ${filePath}")
`;
    return this.exec(code);
  }

  /**
   * Create a simple plot and display it
   */
  async plot(data: number[], title = 'Plot'): Promise<any> {
    const code = `
import matplotlib.pyplot as plt
import numpy as np

data = ${JSON.stringify(data)}
plt.figure(figsize=(8, 6))
plt.plot(data)
plt.title("${title}")
plt.xlabel("Index")
plt.ylabel("Value")
plt.grid(True)
plt.show()
`;
    return this.exec(code);
  }

  /**
   * Get help information for a Python object
   */
  async help(objectName: string): Promise<any> {
    const code = `help(${objectName})`;
    return this.exec(code);
  }

  /**
   * Execute code in a specific notebook/file by name
   */
  async execInFile(fileName: string, code: string): Promise<any> {
    const kernelId = this.findKernelByFileName(fileName);
    if (!kernelId) {
      throw new Error(`No running kernel found for file: ${fileName}`);
    }
    return this.bridge.executeCode(kernelId, code);
  }

  /**
   * Execute code in a specific file and display results
   */
  async runInFile(fileName: string, code: string): Promise<void> {
    try {
      const result = await this.execInFile(fileName, code);
      console.group(`🐍 Python Execution Results in ${fileName}:`);
      
      if (result.outputs && result.outputs.length > 0) {
        result.outputs.forEach((output: any, index: number) => {
          console.group(`Output ${index + 1} (${output.output_type}):`);
          
          switch (output.output_type) {
            case 'stream':
              console.log(`[${output.name}]`, output.text);
              break;
            case 'execute_result':
            case 'display_data':
              if (output.data?.['text/plain']) {
                console.log('Result:', output.data['text/plain']);
              }
              if (output.data?.['text/html']) {
                console.log('HTML output available');
              }
              if (output.data?.['image/png']) {
                console.log('Image output available (base64)');
              }
              break;
            case 'error':
              console.error('Error:', output.ename, output.evalue);
              console.error('Traceback:', output.traceback?.join('\n'));
              break;
          }
          
          console.groupEnd();
        });
      } else {
        console.log('Code executed successfully (no output)');
      }
      
      console.groupEnd();
    } catch (error) {
      console.error(`🚫 Python Execution Failed in ${fileName}:`, error);
    }
  }

  /**
   * Find kernel ID by file name
   */
  private findKernelByFileName(fileName: string): string | null {
    const app = (window as any).jupyterapp;
    if (!app?.serviceManager?.sessions?.running) {
      return null;
    }

    // Normalize file name (remove leading path separators)
    const normalizedFileName = fileName.replace(/^[\/\\]+/, '');
    
    for (const session of app.serviceManager.sessions.running()) {
      if (session.kernel && session.path) {
        // Extract just the filename from the session path
        const sessionFileName = session.path.split('/').pop() || session.path;
        
        // Check for exact match or partial match
        if (sessionFileName === normalizedFileName || 
            sessionFileName === fileName ||
            session.path.endsWith(fileName) ||
            session.path.endsWith(normalizedFileName)) {
          return session.kernel.id;
        }
      }
    }
    
    return null;
  }

  /**
   * List all open files with their kernels
   */
  listOpenFiles(): { fileName: string; fullPath: string; kernelId: string; kernelName: string }[] {
    const app = (window as any).jupyterapp;
    const files: { fileName: string; fullPath: string; kernelId: string; kernelName: string }[] = [];
    
    if (app?.serviceManager?.sessions?.running) {
      for (const session of app.serviceManager.sessions.running()) {
        if (session.kernel && session.path) {
          const fileName = session.path.split('/').pop() || session.path;
          files.push({
            fileName: fileName,
            fullPath: session.path,
            kernelId: session.kernel.id,
            kernelName: session.kernel.name
          });
        }
      }
    }
    
    return files;
  }

  /**
   * Execute code in the first available Python kernel
   */
  async execInPython(code: string): Promise<any> {
    const app = (window as any).jupyterapp;
    if (!app?.serviceManager?.sessions?.running) {
      throw new Error('No running sessions found');
    }

    for (const session of app.serviceManager.sessions.running()) {
      if (session.kernel && (
          session.kernel.name.toLowerCase().includes('python') || 
          session.kernel.name.toLowerCase().includes('pyodide')
      )) {
        return this.bridge.executeCode(session.kernel.id, code);
      }
    }
    
    throw new Error('No Python kernel found');
  }
}

// Create and expose the global console API
const jupyter = new JupyterConsoleAPIExtended();

/**
 * Initialize the console API on the window object
 */
export function initializeConsoleAPI(): void {
  // Main API
  (window as any).jupyter = jupyter;
  
  // Shorthand aliases for convenience
  (window as any).jexec = jupyter.exec.bind(jupyter);
  (window as any).jrun = jupyter.run.bind(jupyter);
  (window as any).jkernels = jupyter.kernels.bind(jupyter);
  
  console.log('JupyterLite Console API initialized!');
  console.log('Available commands:');
  console.log('  jupyter.exec(code) - Execute Python code in active kernel');
  console.log('  jupyter.run(code) - Execute and display results');
  console.log('  jupyter.execInFile("file.ipynb", code) - Execute in specific file');
  console.log('  jupyter.runInFile("file.ipynb", code) - Execute in file with display');
  console.log('  jupyter.execInPython(code) - Execute in first Python kernel');
  console.log('  jupyter.listOpenFiles() - List all open files with kernels');
  console.log('  jupyter.sessions() - List kernel sessions');
  console.log('  jupyter.install(pkg) - Install Python package');
  console.log('  jupyter.setVar(name, value) - Set variable');
  console.log('  jupyter.getVar(name) - Get variable');
  console.log('  jupyter.listVars() - Show all variables');
  console.log('  jupyter.clearVars(true) - Clear all variables');
  console.log('  jupyter.plot([1,2,3,4]) - Create simple plots');
  console.log('');
  console.log('Shortcuts: jexec(), jrun()');
}

export { jupyter };