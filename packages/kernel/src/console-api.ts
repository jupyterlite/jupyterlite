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
      
      // Check if results has outputs array
      const outputs = results.outputs || [];
      
      if (outputs.length > 0) {
        // Display results in a formatted way
        outputs.forEach((result: any, index: number) => {
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
          } else if (result.output_type === 'error') {
            console.error('Error:', result.ename, result.evalue);
            if (result.traceback) {
              console.error('Traceback:', result.traceback.join('\n'));
            }
          }
          
          console.groupEnd();
        });
      } else {
        console.log('Code executed successfully (no output)');
      }
    } catch (error) {
      console.error('Execution failed:', error);
    }
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
  
  console.log('JupyterLite Console API initialized!');
  console.log('Available commands:');
  console.log('  jupyter.exec(code) - Execute Python code in active kernel');
  console.log('  jupyter.run(code) - Execute and display results');
  console.log('  jupyter.execInFile("file.ipynb", code) - Execute in specific file');
  console.log('  jupyter.runInFile("file.ipynb", code) - Execute in file with display');
  console.log('  jupyter.execInPython(code) - Execute in first Python kernel');
  console.log('  jupyter.listOpenFiles() - List all open files with kernels');
  console.log('  jupyter.install(pkg) - Install Python package');
  console.log('  jupyter.execFile(path) - Execute Python file');
  console.log('');
  console.log('Shortcuts: jexec(), jrun()');
}

export { jupyter };