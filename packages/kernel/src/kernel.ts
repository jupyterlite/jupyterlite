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
    const { id, name, location, sendMessage } = options;
    this._id = id;
    this._name = name;
    this._location = location;
    this._sendMessage = sendMessage;
  }

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  get ready(): Promise<void> {
    return Promise.resolve();
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
   * Get the name of the kernel
   */
  get name(): string {
    return this._name;
  }

  /**
   * The location in the virtual filesystem from which the kernel was started.
   */
  get location(): string {
    return this._location;
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
  get parentHeader(): KernelMessage.IHeader<KernelMessage.MessageType> | undefined {
    return this._parentHeader;
  }

  /**
   * Get the last parent message (mimic ipykernel's get_parent)
   */
  get parent(): KernelMessage.IMessage | undefined {
    return this._parent;
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._disposed.emit(void 0);
  }

  /**
   * Handle an incoming message from the client.
   *
   * @param msg The message to handle
   */
  async handleMessage(msg: KernelMessage.IMessage): Promise<void> {
    this._busy(msg);

    this._parent = msg;

    const msgType = msg.header.msg_type;
    switch (msgType) {
      case 'kernel_info_request':
        await this._kernelInfo(msg);
        break;
      case 'execute_request':
        await this._execute(msg);
        break;
      case 'input_reply':
        this.inputReply(msg.content as KernelMessage.IInputReplyMsg['content']);
        break;
      case 'inspect_request':
        await this._inspect(msg);
        break;
      case 'is_complete_request':
        await this._isCompleteRequest(msg);
        break;
      case 'complete_request':
        await this._complete(msg);
        break;
      case 'history_request':
        await this._historyRequest(msg);
        break;
      case 'comm_open':
        await this.commOpen(msg as KernelMessage.ICommOpenMsg);
        break;
      case 'comm_msg':
        await this.commMsg(msg as KernelMessage.ICommMsgMsg);
        break;
      case 'comm_close':
        await this.commClose(msg as KernelMessage.ICommCloseMsg);
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
  ): Promise<KernelMessage.IExecuteReplyMsg['content']>;

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
   * Send an `input_reply` message.
   *
   * @param content - The content of the reply.
   */
  abstract inputReply(content: KernelMessage.IInputReplyMsg['content']): void;

  /**
   * Send an `comm_open` message.
   *
   * @param msg - The comm_open message.
   */
  abstract commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void>;

  /**
   * Send an `comm_msg` message.
   *
   * @param msg - The comm_msg message.
   */
  abstract commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void>;

  /**
   * Send an `comm_close` message.
   *
   * @param close - The comm_close message.
   */
  abstract commClose(msg: KernelMessage.ICommCloseMsg): Promise<void>;

  /**
   * Stream an event from the kernel
   *
   * @param parentHeader The parent header.
   * @param content The stream content.
   */
  protected stream(
    content: KernelMessage.IStreamMsg['content'],
    parentHeader:
      | KernelMessage.IHeader<KernelMessage.MessageType>
      | undefined = undefined
  ): void {
    const parentHeaderValue =
      typeof parentHeader !== 'undefined' ? parentHeader : this._parentHeader;
    const message = KernelMessage.createMessage<KernelMessage.IStreamMsg>({
      channel: 'iopub',
      msgType: 'stream',
      // TODO: better handle this
      session: parentHeaderValue?.session ?? '',
      parentHeader: parentHeaderValue,
      content,
    });
    this._sendMessage(message);
  }

  /**
   * Send a `display_data` message to the client.
   *
   * @param parentHeader The parent header.
   * @param content The display_data content.
   */
  protected displayData(
    content: KernelMessage.IDisplayDataMsg['content'],
    parentHeader:
      | KernelMessage.IHeader<KernelMessage.MessageType>
      | undefined = undefined
  ): void {
    // Make sure metadata is always set
    const parentHeaderValue =
      typeof parentHeader !== 'undefined' ? parentHeader : this._parentHeader;
    content.metadata = content.metadata ?? {};

    const message = KernelMessage.createMessage<KernelMessage.IDisplayDataMsg>({
      channel: 'iopub',
      msgType: 'display_data',
      // TODO: better handle this
      session: parentHeaderValue?.session ?? '',
      parentHeader: parentHeaderValue,
      content,
    });
    this._sendMessage(message);
  }

  /**
   * Send a `input_request` message to the client.
   *
   * @param parentHeader The parent header.
   * @param content The input_request content.
   */
  protected inputRequest(
    content: KernelMessage.IInputRequestMsg['content'],
    parentHeader:
      | KernelMessage.IHeader<KernelMessage.MessageType>
      | undefined = undefined
  ): void {
    const parentHeaderValue =
      typeof parentHeader !== 'undefined' ? parentHeader : this._parentHeader;
    const message = KernelMessage.createMessage<KernelMessage.IInputRequestMsg>({
      channel: 'stdin',
      msgType: 'input_request',
      // TODO: better handle this
      session: parentHeaderValue?.session ?? '',
      parentHeader: parentHeaderValue,
      content,
    });
    this._sendMessage(message);
  }

  /**
   * Send an `execute_result` message.
   *
   * @param parentHeader The parent header.
   * @param content The execute result content.
   */
  protected publishExecuteResult(
    content: KernelMessage.IExecuteResultMsg['content'],
    parentHeader:
      | KernelMessage.IHeader<KernelMessage.MessageType>
      | undefined = undefined
  ): void {
    const parentHeaderValue =
      typeof parentHeader !== 'undefined' ? parentHeader : this._parentHeader;
    const message = KernelMessage.createMessage<KernelMessage.IExecuteResultMsg>({
      channel: 'iopub',
      msgType: 'execute_result',
      // TODO: better handle this
      session: parentHeaderValue?.session ?? '',
      parentHeader: parentHeaderValue,
      content,
    });
    this._sendMessage(message);
  }

  /**
   * Send an `error` message to the client.
   *
   * @param parentHeader The parent header.
   * @param content The error content.
   */
  protected publishExecuteError(
    content: KernelMessage.IErrorMsg['content'],
    parentHeader:
      | KernelMessage.IHeader<KernelMessage.MessageType>
      | undefined = undefined
  ): void {
    const parentHeaderValue =
      typeof parentHeader !== 'undefined' ? parentHeader : this._parentHeader;
    const message = KernelMessage.createMessage<KernelMessage.IErrorMsg>({
      channel: 'iopub',
      msgType: 'error',
      // TODO: better handle this
      session: parentHeaderValue?.session ?? '',
      parentHeader: parentHeaderValue,
      content,
    });
    this._sendMessage(message);
  }

  /**
   * Send a `update_display_data` message to the client.
   *
   * @param parentHeader The parent header.
   * @param content The update_display_data content.
   */
  protected updateDisplayData(
    content: KernelMessage.IUpdateDisplayDataMsg['content'],
    parentHeader:
      | KernelMessage.IHeader<KernelMessage.MessageType>
      | undefined = undefined
  ): void {
    const parentHeaderValue =
      typeof parentHeader !== 'undefined' ? parentHeader : this._parentHeader;
    const message = KernelMessage.createMessage<KernelMessage.IUpdateDisplayDataMsg>({
      channel: 'iopub',
      msgType: 'update_display_data',
      // TODO: better handle this
      session: parentHeaderValue?.session ?? '',
      parentHeader: parentHeaderValue,
      content,
    });
    this._sendMessage(message);
  }

  /**
   * Send a `clear_output` message to the client.
   *
   * @param parentHeader The parent header.
   * @param content The clear_output content.
   */
  protected clearOutput(
    content: KernelMessage.IClearOutputMsg['content'],
    parentHeader:
      | KernelMessage.IHeader<KernelMessage.MessageType>
      | undefined = undefined
  ): void {
    const parentHeaderValue =
      typeof parentHeader !== 'undefined' ? parentHeader : this._parentHeader;
    const message = KernelMessage.createMessage<KernelMessage.IClearOutputMsg>({
      channel: 'iopub',
      msgType: 'clear_output',
      // TODO: better handle this
      session: parentHeaderValue?.session ?? '',
      parentHeader: parentHeaderValue,
      content,
    });
    this._sendMessage(message);
  }

  /**
   * Send a `comm` message to the client.
   *
   * @param .
   */
  protected handleComm(
    type: 'comm_close' | 'comm_msg' | 'comm_open',
    content: KernelMessage.ICommMsgMsg['content'],
    metadata: KernelMessage.ICommMsgMsg['metadata'],
    buffers: KernelMessage.ICommMsgMsg['buffers'],
    parentHeader:
      | KernelMessage.IHeader<KernelMessage.MessageType>
      | undefined = undefined
  ): void {
    const parentHeaderValue =
      typeof parentHeader !== 'undefined' ? parentHeader : this._parentHeader;
    const message = KernelMessage.createMessage<any>({
      channel: 'iopub',
      msgType: type,
      // TODO: better handle this
      session: parentHeaderValue?.session ?? '',
      parentHeader: parentHeaderValue,
      content,
      metadata,
      buffers,
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
      session: parent.header.session,
      parentHeader: parent.header,
      channel: 'iopub',
      content: {
        execution_state: 'idle',
      },
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
      session: parent.header.session,
      parentHeader: parent.header,
      channel: 'iopub',
      content: {
        execution_state: 'busy',
      },
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
      session: parent.header.session,
      parentHeader: parent.header as KernelMessage.IHeader<'kernel_info_request'>,
      content,
    });

    this._sendMessage(message);
  }

  /**
   * Handle a `history_request` message
   *
   * @param msg The parent message.
   */
  private async _historyRequest(msg: KernelMessage.IMessage): Promise<void> {
    const historyMsg = msg as KernelMessage.IHistoryRequestMsg;
    const message = KernelMessage.createMessage<KernelMessage.IHistoryReplyMsg>({
      msgType: 'history_reply',
      channel: 'shell',
      parentHeader: historyMsg.header,
      session: msg.header.session,
      content: {
        status: 'ok',
        history: this._history as KernelMessage.IHistoryReply['history'],
      },
    });
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
    const message = KernelMessage.createMessage<KernelMessage.IExecuteInputMsg>({
      msgType: 'execute_input',
      parentHeader: parent.header,
      channel: 'iopub',
      session: msg.header.session,
      content: {
        code,
        execution_count: this._executionCount,
      },
    });
    this._sendMessage(message);
  }

  /**
   * Handle an execute_request message.
   *
   * @param msg The parent message.
   */
  private async _execute(msg: KernelMessage.IMessage): Promise<void> {
    const executeMsg = msg as KernelMessage.IExecuteRequestMsg;
    const content = executeMsg.content;
    if (content.store_history) {
      this._executionCount++;
    }

    // TODO: handle differently
    this._parentHeader = executeMsg.header;

    this._executeInput(executeMsg);

    if (content.store_history) {
      this._history.push([0, 0, content.code]);
    }

    const reply = await this.executeRequest(executeMsg.content);
    const message = KernelMessage.createMessage<KernelMessage.IExecuteReplyMsg>({
      msgType: 'execute_reply',
      channel: 'shell',
      parentHeader: executeMsg.header,
      session: msg.header.session,
      content: reply,
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
    const message = KernelMessage.createMessage<KernelMessage.ICompleteReplyMsg>({
      msgType: 'complete_reply',
      parentHeader: completeMsg.header,
      channel: 'shell',
      session: msg.header.session,
      content,
    });

    this._sendMessage(message);
  }

  /**
   * Handle an inspect_request message
   *
   * @param msg The parent message.
   */
  private async _inspect(msg: KernelMessage.IMessage): Promise<void> {
    const inspectMsg = msg as KernelMessage.IInspectRequestMsg;
    const content = await this.inspectRequest(inspectMsg.content);
    const message = KernelMessage.createMessage<KernelMessage.IInspectReplyMsg>({
      msgType: 'inspect_reply',
      parentHeader: inspectMsg.header,
      channel: 'shell',
      session: msg.header.session,
      content,
    });

    this._sendMessage(message);
  }

  /**
   * Handle an is_complete_request message
   *
   * @param msg The parent message.
   */
  private async _isCompleteRequest(msg: KernelMessage.IMessage): Promise<void> {
    const isCompleteMsg = msg as KernelMessage.IIsCompleteRequestMsg;
    const content = await this.isCompleteRequest(isCompleteMsg.content);
    const message = KernelMessage.createMessage<KernelMessage.IIsCompleteReplyMsg>({
      msgType: 'is_complete_reply',
      parentHeader: isCompleteMsg.header,
      channel: 'shell',
      session: msg.header.session,
      content,
    });

    this._sendMessage(message);
  }

  private _id: string;
  private _name: string;
  private _location: string;
  private _history: [number, number, string][] = [];
  private _executionCount = 0;
  private _isDisposed = false;
  private _disposed = new Signal<this, void>(this);
  private _sendMessage: IKernel.SendMessage;
  private _parentHeader: KernelMessage.IHeader<KernelMessage.MessageType> | undefined =
    undefined;
  private _parent: KernelMessage.IMessage | undefined = undefined;
}
