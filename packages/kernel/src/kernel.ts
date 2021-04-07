import { KernelMessage } from '@jupyterlab/services';

import { ISignal, Signal } from '@lumino/signaling';

import { IKernel } from './tokens';

/**
 * A base kernel class handling basic kernel messaging.
 */
export abstract class BaseKernel implements IKernel {
  /**
   * Construct a new BaseKernel.
   *
   * @param options The instantiation options for a BaseKernel.
   */
  constructor(options: IKernel.IOptions) {
    const { id, sessionId, sendMessage } = options;
    this._id = id;
    // TODO: handle session id
    this._sessionId = sessionId;
    this._sendMessage = sendMessage;
  }

  /**
   * Return whether the kernel is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * A signal emitted when the kernel is disposed.
   */
  get disposed(): ISignal<this, void> {
    return this._disposed;
  }

  /**
   * Get the kernel id
   */
  get id(): string {
    return this._id;
  }

  /**
   * The current execution count
   */
  get executionCount(): number {
    return this._executionCount;
  }

  /**
   * Get the last parent header
   */
  get parentHeader():
    | KernelMessage.IHeader<KernelMessage.MessageType>
    | undefined {
    return this._parentHeader;
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
  }

  /**
   * Handle an incoming message from the client.
   *
   * @param msg The message to handle
   */
  async handleMessage(msg: KernelMessage.IMessage): Promise<void> {
    this._busy(msg);

    const msgType = msg.header.msg_type;
    switch (msgType) {
      case 'kernel_info_request':
        await this._kernelInfo(msg);
        break;
      case 'execute_request':
        await this._executeRequest(msg);
        break;
      case 'complete_request':
        await this._complete(msg);
        break;
      case 'history_request':
        await this._historyRequest(msg);
        break;
      default:
        break;
    }

    this._idle(msg);
  }

  /**
   * Handle a `kernel_info_request` message.
   *
   * @returns A promise that resolves with the kernel info.
   */
  abstract kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']>;

  /**
   * Handle an `execute_request` message.
   *
   * @param content - The content of the execute_request kernel message
   */
  abstract executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteResultMsg['content']>;

  /**
   * Handle a `complete_request` message.
   *
   * @param content - The content of the request.
   */
  abstract completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']>;

  /**
   * Handle an `inspect_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  abstract inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']>;

  /**
   * Handle an `is_complete_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  abstract isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']>;

  /**
   * Handle a `comm_info_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  abstract commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']>;

  /**
   * Send an `input_request` message.
   *
   * @param content - The content of the request.
   */
  abstract inputRequest(
    content: KernelMessage.IInputRequestMsg['content']
  ): Promise<void>;

  /**
   * Stream an event from the kernel
   *
   * @param parentHeader The parent header.
   * @param content The stream content.
   */
  stream(content: KernelMessage.IStreamMsg['content']): void {
    const message = KernelMessage.createMessage<KernelMessage.IStreamMsg>({
      channel: 'iopub',
      msgType: 'stream',
      session: this._sessionId,
      parentHeader: this._parentHeader,
      content
    });
    this._sendMessage(message);
  }

  /**
   * Send an 'idle' status message.
   *
   * @param parent The parent message
   */
  private _idle(parent: KernelMessage.IMessage): void {
    const message = KernelMessage.createMessage<KernelMessage.IStatusMsg>({
      msgType: 'status',
      session: this._sessionId,
      parentHeader: parent.header,
      channel: 'iopub',
      content: {
        execution_state: 'idle'
      }
    });
    this._sendMessage(message);
  }

  /**
   * Send a 'busy' status message.
   *
   * @param parent The parent message.
   */
  private _busy(parent: KernelMessage.IMessage): void {
    const message = KernelMessage.createMessage<KernelMessage.IStatusMsg>({
      msgType: 'status',
      session: '',
      parentHeader: parent.header,
      channel: 'iopub',
      content: {
        execution_state: 'busy'
      }
    });
    this._sendMessage(message);
  }

  /**
   * Handle a kernel_info_request message
   *
   * @param parent The parent message.
   */
  private async _kernelInfo(parent: KernelMessage.IMessage): Promise<void> {
    const content = await this.kernelInfoRequest();

    const message = KernelMessage.createMessage<KernelMessage.IInfoReplyMsg>({
      msgType: 'kernel_info_reply',
      channel: 'shell',
      session: this._sessionId,
      parentHeader: parent.header as KernelMessage.IHeader<
        'kernel_info_request'
      >,
      content
    });

    this._sendMessage(message);
  }

  /**
   * Handle an `execute_request` message
   *
   * @param msg The parent message.
   */
  private async _executeRequest(msg: KernelMessage.IMessage): Promise<void> {
    const executeMsg = msg as KernelMessage.IExecuteRequestMsg;
    const content = executeMsg.content;
    this._executionCount++;

    // TODO: handle differently
    this._parentHeader = msg.header;

    this._executeInput(msg);
    try {
      const result = await this.executeRequest(content);
      this._history.push([0, 0, content.code]);
      this._executeResult(msg, result);
      this._executeReply(msg, {
        execution_count: this._executionCount,
        status: 'ok',
        user_expressions: {},
        payload: []
      });
    } catch (e) {
      const { name, stack, message } = e;
      const error = {
        ename: name,
        evalue: message,
        traceback: [stack]
      };
      this._error(msg, error);
      this._executeReply(msg, {
        execution_count: this._executionCount,
        status: 'error',
        ...error
      });
    }
  }

  /**
   * Handle a `history_request` message
   *
   * @param msg The parent message.
   */
  private async _historyRequest(msg: KernelMessage.IMessage): Promise<void> {
    const historyMsg = msg as KernelMessage.IHistoryRequestMsg;
    const message = KernelMessage.createMessage<KernelMessage.IHistoryReplyMsg>(
      {
        msgType: 'history_reply',
        channel: 'shell',
        parentHeader: historyMsg.header,
        session: this._sessionId,
        content: {
          status: 'ok',
          history: this._history as KernelMessage.IHistoryReply['history']
        }
      }
    );
    this._sendMessage(message);
  }

  /**
   * Send an `execute_input` message.
   *
   * @param msg The parent message.
   */
  private _executeInput(msg: KernelMessage.IMessage): void {
    const parent = msg as KernelMessage.IExecuteInputMsg;
    const code = parent.content.code;
    const message = KernelMessage.createMessage<KernelMessage.IExecuteInputMsg>(
      {
        msgType: 'execute_input',
        parentHeader: parent.header,
        channel: 'iopub',
        session: this._sessionId,
        content: {
          code,
          execution_count: this._executionCount
        }
      }
    );
    this._sendMessage(message);
  }

  /**
   * Send an `execute_result` message.
   *
   * @param msg The parent message.
   * @param content The execut result content.
   */
  private _executeResult(
    msg: KernelMessage.IMessage,
    content: Pick<
      KernelMessage.IExecuteResultMsg['content'],
      'data' | 'metadata'
    >
  ): void {
    const message = KernelMessage.createMessage<
      KernelMessage.IExecuteResultMsg
    >({
      msgType: 'execute_result',
      parentHeader: msg.header,
      channel: 'iopub',
      session: this._sessionId,
      content: {
        ...content,
        execution_count: this._executionCount
      }
    });
    this._sendMessage(message);
  }

  /**
   * Send an `execute_reply` message.
   *
   * @param msg The parent message.
   * @param content The content for the execute reply.
   */
  private _executeReply(
    msg: KernelMessage.IMessage,
    content: KernelMessage.IExecuteReplyMsg['content']
  ): void {
    const parent = msg as KernelMessage.IExecuteRequestMsg;
    const message = KernelMessage.createMessage<KernelMessage.IExecuteReplyMsg>(
      {
        msgType: 'execute_reply',
        channel: 'shell',
        parentHeader: parent.header,
        session: this._sessionId,
        content
      }
    );
    this._sendMessage(message);
  }

  /**
   * Send an `error` message.
   *
   * @param msg The parent message.
   * @param content The content for the execution error response.
   */
  private _error(
    msg: KernelMessage.IMessage,
    content: KernelMessage.IErrorMsg['content']
  ): void {
    const message = KernelMessage.createMessage<KernelMessage.IErrorMsg>({
      msgType: 'error',
      parentHeader: msg.header,
      channel: 'iopub',
      session: this._sessionId,
      content
    });
    this._sendMessage(message);
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  private async _complete(msg: KernelMessage.IMessage): Promise<void> {
    const completeMsg = msg as KernelMessage.ICompleteRequestMsg;
    const content = await this.completeRequest(completeMsg.content);
    const message = KernelMessage.createMessage<
      KernelMessage.ICompleteReplyMsg
    >({
      msgType: 'complete_reply',
      parentHeader: completeMsg.header,
      channel: 'shell',
      session: this._sessionId,
      content
    });

    this._sendMessage(message);
  }

  private _id: string;
  private _history: [number, number, string][] = [];
  private _executionCount = 0;
  private _sessionId: string;
  private _isDisposed = false;
  private _disposed = new Signal<this, void>(this);
  private _sendMessage: IKernel.SendMessage;
  private _parentHeader:
    | KernelMessage.IHeader<KernelMessage.MessageType>
    | undefined = undefined;
}
