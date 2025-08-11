/**
 * Kernel Bridge - Exposes running kernels to the main thread
 */

import { KernelMessage } from '@jupyterlab/services';
import { LiteKernelClient } from './client';

/**
 * Interface for kernel execution from external contexts
 */
export interface IKernelBridge {
  /**
   * Execute code in a specific kernel
   */
  executeCode(kernelId: string, code: string): Promise<any>;
  
  /**
   * Get all running kernels
   */
  getRunningKernels(): { [kernelId: string]: any };
  
  /**
   * Get kernel by notebook path
   */
  getKernelByPath(path: string): string | null;
  
  /**
   * Send raw message to kernel
   */
  sendMessage(kernelId: string, message: KernelMessage.IMessage): void;
}

/**
 * Global kernel access bridge
 */
export class KernelBridge implements IKernelBridge {
  private _pathToKernel = new Map<string, string>();

  constructor(kernelClient: LiteKernelClient) {
    // kernelClient parameter kept for API compatibility but not stored
    // since we use JupyterLab app directly via window.jupyterapp
  }

  /**
   * Register a kernel with its notebook path
   */
  registerKernelPath(kernelId: string, path: string): void {
    this._pathToKernel.set(path, kernelId);
  }

  /**
   * Execute code in a specific kernel and return the result
   */
  async executeCode(kernelId: string, code: string): Promise<any> {
    // Use JupyterLab's public API approach instead of low-level access
    const app = (window as any).jupyterapp;
    if (!app) {
      throw new Error('JupyterLab application not available');
    }

    // Find the active kernel connection
    let kernel: any = null;
    const current = app.shell.currentWidget;
    
    if (current?.sessionContext?.session?.kernel?.id === kernelId) {
      kernel = current.sessionContext.session.kernel;
    } else {
      // Use kernel manager to find the proper kernel connection
      const serviceManager = app.serviceManager;
      if (serviceManager?.kernels) {
        // First find if kernel exists in running kernels
        const runningKernel = Array.from(serviceManager.kernels.running()).find((k: any) => k.id === kernelId);
        if (runningKernel) {
          // Get the actual kernel connection object
          kernel = serviceManager.kernels.findById(kernelId);
        }
      }
    }

    if (!kernel) {
      throw new Error(`Kernel ${kernelId} not found or not accessible`);
    }

    // Verify kernel has requestExecute method
    if (!kernel.requestExecute || typeof kernel.requestExecute !== 'function') {
      console.error('Kernel object:', kernel);
      console.error('Kernel type:', typeof kernel);
      console.error('Kernel methods:', Object.getOwnPropertyNames(kernel));
      throw new Error(`Kernel ${kernelId} does not have requestExecute method. Got: ${typeof kernel.requestExecute}`);
    }

    return new Promise((resolve, reject) => {
      const future = kernel.requestExecute({ code });
      const outputs: any[] = [];
      let error: any = null;

      // Handle execution results
      future.onIOPub = (msg: any) => {
        switch (msg.header.msg_type) {
          case 'execute_result':
          case 'display_data':
            outputs.push({
              output_type: msg.header.msg_type,
              data: msg.content.data,
              metadata: msg.content.metadata || {}
            });
            break;
          case 'stream':
            outputs.push({
              output_type: 'stream',
              name: msg.content.name,
              text: msg.content.text
            });
            break;
          case 'error':
            error = {
              output_type: 'error',
              ename: msg.content.ename,
              evalue: msg.content.evalue,
              traceback: msg.content.traceback
            };
            break;
        }
      };

      // Handle completion
      future.onReply = (msg: any) => {
        if (msg.content.status === 'ok') {
          resolve({
            status: 'ok',
            execution_count: msg.content.execution_count,
            outputs: outputs
          });
        } else {
          reject(error || {
            status: 'error',
            error: msg.content
          });
        }
      };

      // Handle errors
      future.onStdin = () => {
        reject(new Error('Kernel requested stdin, but not supported in bridge mode'));
      };
    });
  }

  /**
   * Get all running kernels from JupyterLab's service manager
   */
  getRunningKernels(): { [kernelId: string]: any } {
    const app = (window as any).jupyterapp;
    const kernels: { [kernelId: string]: any } = {};
    
    if (app?.serviceManager?.sessions?.running) {
      for (const session of app.serviceManager.sessions.running()) {
        if (session.kernel) {
          kernels[session.kernel.id] = {
            id: session.kernel.id,
            name: session.kernel.name,
            model: session.kernel.model,
            status: session.kernel.status,
            sessionId: session.id,
            sessionName: session.name,
            sessionPath: session.path
          };
        }
      }
    }
    
    return kernels;
  }

  /**
   * Get the current active kernel (from the active notebook)
   */
  getActiveKernel(): string | null {
    const app = (window as any).jupyterapp;
    if (app?.shell?.currentWidget?.sessionContext?.session?.kernel) {
      return app.shell.currentWidget.sessionContext.session.kernel.id;
    }
    return null;
  }

  /**
   * Get kernel ID by notebook path
   */
  getKernelByPath(path: string): string | null {
    return this._pathToKernel.get(path) || null;
  }

  /**
   * Send raw message to kernel - simplified implementation
   */
  sendMessage(kernelId: string, message: KernelMessage.IMessage): void {
    console.warn('Raw message sending not implemented in this version');
  }
}

// Global instance
let _kernelBridge: KernelBridge | null = null;

/**
 * Initialize the global kernel bridge
 */
export function initializeKernelBridge(kernelClient: LiteKernelClient): void {
  _kernelBridge = new KernelBridge(kernelClient);
  
  // Expose to window object for console access
  (window as any).jupyterKernelBridge = _kernelBridge;
}

/**
 * Get the global kernel bridge instance
 */
export function getKernelBridge(): KernelBridge | null {
  return _kernelBridge;
}