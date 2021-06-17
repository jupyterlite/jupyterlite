import { Kernel, KernelMessage, KernelSpec } from '@jupyterlab/services';

import { Token } from '@lumino/coreutils';

import { IObservableDisposable } from '@lumino/disposable';

import { Kernels } from './kernels';

import { KernelSpecs } from './kernelspecs';

/**
 * The token for the kernels service.
 */
export const IKernels = new Token<IKernels>('@jupyterlite/kernel:IKernels');

/**
 * An interface for the Kernels service.
 */
export interface IKernels {
  /**
   * Start a new kernel.
   *
   * @param options The kernel startup options.
   */
  startNew: (options: Kernels.IKernelOptions) => Promise<Kernel.IModel>;

  /**
   * Restart a kernel.
   *
   * @param id The kernel id.
   */
  restart: (id: string) => Promise<Kernel.IModel>;

  /**
   * Shut down a kernel.
   *
   * @param id The kernel id.
   */
  shutdown: (id: string) => Promise<void>;
}

/**
 * An interface for a kernel running in the browser.
 */
export interface IKernel extends IObservableDisposable {
  /**
   * The id of the server-side kernel.
   */
  readonly id: string;

  /**
   * The name of the server-side kernel.
   */
  readonly name: string;

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  readonly ready: Promise<void>;

  /**
   * A comm manager.
   */
  readonly comm_manager: ICommManager;

  /**
   * Handle an incoming message from the client.
   *
   * @param msg The message to handle
   */
  handleMessage(msg: KernelMessage.IMessage): Promise<void>;

  /**
   * Handle a `kernel_info_request` message.
   *
   * @returns A promise that resolves with the kernel info.
   */
  kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']>;

  /**
   * Handle an `execute_request` message.
   *
   * @param content - The content of the execute_request kernel message
   */
  executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteResultMsg['content']>;

  /**
   * Handle a `complete_request` message.
   *
   * @param content - The content of the request.
   */
  completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']>;

  /**
   * Handle an `inspect_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']>;

  /**
   * Handle an `is_complete_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']>;

  /**
   * Handle a `comm_info_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']>;

  /**
   * Send an `input_request` message.
   *
   * @param content - The content of the request.
   */
  inputRequest(content: KernelMessage.IInputRequestMsg['content']): Promise<void>;
}

/**
 * A namespace for IKernel statics.
 */
export namespace IKernel {
  /**
   * The type for the send message function.
   */
  export type SendMessage = (msg: KernelMessage.IMessage) => void;

  /**
   * The instantiation options for an IKernel.
   */
  export interface IOptions {
    /**
     * The kernel id.
     */
    id: string;

    /**
     * The name of the kernel.
     */
    name: string;

    /**
     * The method to send messages back to the server.
     */
    sendMessage: SendMessage;

    /*
     * The comm manager.
     */
    comm_manager?: ICommManager;
  }
}

/**
 * The token for the kernel spec service.
 */
export const IKernelSpecs = new Token<IKernelSpecs>(
  '@jupyterlite/kernelspec:IKernelSpecs'
);

/**
 * The interface for the kernel specs service.
 */
export interface IKernelSpecs {
  /**
   * Get the kernel specs.
   */
  readonly specs: KernelSpec.ISpecModels | null;

  /**
   * Get the kernel factories for the current kernels.
   */
  readonly factories: KernelSpecs.KernelFactories;

  /**
   * Register a new kernel spec
   *
   * @param options The kernel spec options.
   */
  register: (options: KernelSpecs.IKernelOptions) => void;
}

export interface ICommManager {
  /** kernel = Instance('ipykernel.kernelbase.Kernel') */
  kernel: IKernel;
  /** comms = Dict() */
  comms: Map<string, ICommManager.IComm>;
  /** targets = Dict() */
  targets: Map<string, ICommManager.ITarget>;
  /** register_target(self, target_name, f): */
  register_target(target_name: string, f: ICommManager.ITarget): void;
  /** unregister_target(self, target_name, f): */
  unregister_target(
    target_name: string,
    f: ICommManager.ITarget
  ): ICommManager.ITarget | null;
  /** register_comm(self, comm): */
  register_comm(comm: ICommManager.IComm): string;
  /** unregister_comm(self, comm):  */
  unregister_comm(comm: ICommManager.IComm): void;
  /** get_comm(self, comm_id): */
  get_comm(comm_id: string): ICommManager.IComm;
  /** comm_open(self, stream, ident, msg): */
  comm_open(msg: any): Promise<void>;
  /** comm_msg(self, stream, ident, msg):  */
  comm_msg(msg: any): Promise<void>;
  /** comm_close(self, stream, ident, msg): */
  comm_close(msg: any): Promise<void>;
}

export namespace ICommManager {
  export interface IOptions {
    /** kernel = Instance('ipykernel.kernelbase.Kernel') */
    kernel: IKernel;
    sendMessage: IKernel.SendMessage;
  }

  export interface IComm {
    comm_id: string;
    /** kernel = Instance('ipykernel.kernelbase.Kernel') */
    kernel: IKernel;
    primary: boolean;
    /** open(self, data=None, metadata=None, buffers=None): */
    open(data?: any, metdata?: any, buffers?: any): Promise<void>;
    /** close(self, data=None, metadata=None, buffers=None, deleting=False): */
    close(data?: any, metadata?: any, buffers?: any, deleting?: boolean): Promise<void>;
    /** send(self, data=None, metadata=None, buffers=None): */
    send(data?: any, metadata?: any, buffers?: any): Promise<void>;
    on_close(callback: (msg: any) => Promise<void>): void;
    on_msg(callback: (msg: any) => Promise<void>): void;
    handle_close(msg: any): Promise<void>;
    handle_msg(msg: any): Promise<void>;
    _closed: boolean;
  }

  export interface ICommOptions {
    sendMessage: IKernel.SendMessage;
    kernel: IKernel;
    comm_id: string;
    primary: boolean;
    target_name: string;
    topic?: string;
    data?: any;
    metadata?: any;
    buffers?: any;
  }

  export interface ITarget {
    (comm: IComm, msg: any): Promise<void>;
  }

  export class APINotImplemented extends Error {}
}
