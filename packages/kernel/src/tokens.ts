// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { Remote } from 'comlink';

import { IObservableMap } from '@jupyterlab/observables';

import { Kernel, KernelMessage, KernelSpec } from '@jupyterlab/services';

import { Token } from '@lumino/coreutils';

import { IObservableDisposable } from '@lumino/disposable';

import { ISignal } from '@lumino/signaling';

import { KernelSpecs } from './kernelspecs';

/**
 * The kernel name of last resort.
 */
export const FALLBACK_KERNEL = 'javascript';

/**
 * The token for the kernel client.
 */
export const IKernelClient = new Token<IKernelClient>(
  '@jupyterlite/kernel:IKernelClient',
);

/**
 * An interface for the Kernels service.
 */
export interface IKernelClient extends Kernel.IKernelAPIClient {
  /**
   * Signal emitted when the kernels map changes
   */
  readonly changed: ISignal<IKernelClient, IObservableMap.IChangedArgs<IKernel>>;

  /**
   * Handle stdin request received from Service Worker.
   */
  handleStdin(
    inputRequest: KernelMessage.IInputRequestMsg,
  ): Promise<KernelMessage.IInputReplyMsg>;

  /**
   * Shut down all kernels.
   */
  shutdownAll: () => Promise<void>;
}

/**
 * The token for the kernel spec client.
 */
export const IKernelSpecClient = new Token<IKernelSpecClient>(
  '@jupyterlite/kernel:IKernelSpecClient',
);

/**
 * An interface for the kernel spec client.
 */
export interface IKernelSpecClient extends KernelSpec.IKernelSpecAPIClient {}

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
   * The location in the virtual filesystem from which the kernel was started.
   */
  readonly location: string;

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  readonly ready: Promise<void>;

  /**
   * Handle an incoming message from the client.
   *
   * @param msg The message to handle
   */
  handleMessage(msg: KernelMessage.IMessage): Promise<void>;
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
     * The location in the virtual filesystem from which the kernel was started.
     */
    location: string;

    /**
     * The method to send messages back to the server.
     */
    sendMessage: SendMessage;
  }
}

/**
 * The token for the kernel spec service.
 */
export const IKernelSpecs = new Token<IKernelSpecs>('@jupyterlite/kernel:IKernelSpecs');

/**
 * The interface for the kernel specs service.
 */
export interface IKernelSpecs {
  /**
   * Get the kernel specs.
   */
  readonly specs: KernelSpec.ISpecModels | null;

  /**
   * Get the default kernel name.
   */
  readonly defaultKernelName: string;

  /**
   * Get the kernel factories for the current kernels.
   */
  readonly factories: KernelSpecs.KernelFactories;

  /**
   * Signal emitted when the specs change.
   */
  readonly changed: ISignal<IKernelSpecs, KernelSpec.ISpecModels | null>;

  /**
   * Register a new kernel spec
   *
   * @param options The kernel spec options.
   */
  register: (options: KernelSpecs.IKernelOptions) => void;
}

/**
 * An interface for a comlink-based worker kernel
 */
export interface IWorkerKernel {
  /**
   * Handle any lazy setup activities.
   */
  initialize(options: IWorkerKernel.IOptions): Promise<void>;
  execute(
    content: KernelMessage.IExecuteRequestMsg['content'],
    parent: any,
  ): Promise<KernelMessage.IExecuteReplyMsg['content']>;
  complete(
    content: KernelMessage.ICompleteRequestMsg['content'],
    parent: any,
  ): Promise<KernelMessage.ICompleteReplyMsg['content']>;
  inspect(
    content: KernelMessage.IInspectRequestMsg['content'],
    parent: any,
  ): Promise<KernelMessage.IInspectReplyMsg['content']>;
  isComplete(
    content: KernelMessage.IIsCompleteRequestMsg['content'],
    parent: any,
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']>;
  commInfo(
    content: KernelMessage.ICommInfoRequestMsg['content'],
    parent: any,
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']>;
  commOpen(content: KernelMessage.ICommOpenMsg, parent: any): Promise<void>;
  commMsg(content: KernelMessage.ICommMsgMsg, parent: any): Promise<void>;
  commClose(content: KernelMessage.ICommCloseMsg, parent: any): Promise<void>;
  inputReply(
    content: KernelMessage.IInputReplyMsg['content'],
    parent: any,
  ): Promise<void>;
}

/**
 * A namespace for worker kernels.
 **/
export namespace IWorkerKernel {
  /**
   * Common values likely to be required by all kernels.
   */
  export interface IOptions {
    /**
     * The base URL of the kernel server.
     */
    baseUrl: string;
  }
}

export interface IRemoteKernel extends Remote<IWorkerKernel> {}
