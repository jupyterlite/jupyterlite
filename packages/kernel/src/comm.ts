import { UUID } from '@lumino/coreutils';

import { KernelMessage } from '@jupyterlab/services';

import { ICommManager, IKernel } from './tokens';

export class Comm implements ICommManager.IComm {
  public _closed = true;
  private _sendMessage: IKernel.SendMessage;

  constructor(options: ICommManager.ICommOptions) {
    // TODO: what does a default kernel even look like?
    this._kernel = options.kernel;
    this._sendMessage = options.sendMessage;
    /*
      @default('comm_id')
      def _default_comm_id(self):
          return uuid.uuid4().hex
    */
    this._comm_id = options.comm_id || UUID.uuid4();
    this._primary = options.primary === false ? false : true;
    this._target_name = options.target_name;
    this._topic = options.topic || `comm-${this._comm_id}`;
    /*
        def __init__(self, target_name='', data=None, metadata=None, buffers=None, **kwargs):
        if target_name:
            kwargs['target_name'] = target_name
        super(Comm, self).__init__(**kwargs)
        if self.kernel:
            if self.primary:
                # I am primary, open my peer.
                self.open(data=data, metadata=metadata, buffers=buffers)
            else:
                self._closed = False

     */
    if (this._kernel) {
      if (this._primary) {
        void this.open(options);
      }
    }
  }

  /** kernel = Instance('ipykernel.kernelbase.Kernel', allow_none=True) */
  private _kernel: IKernel;
  get kernel(): IKernel {
    return this._kernel;
  }
  set kernel(kernel: IKernel) {
    this._kernel = kernel;
  }

  /** comm_id = Unicode() */
  private _comm_id: string;
  get comm_id(): string {
    return this._comm_id;
  }

  /** primary = Bool(True, help="Am I the primary or secondary Comm?") */
  private _primary = true;
  get primary(): boolean {
    return this._primary;
  }

  /** target name e.g. jupyter.widgets */
  private _target_name: string;
  get target_name(): string {
    return this._target_name;
  }

  // TODO:
  // target_module = Unicode(None, allow_none=True, help="""requirejs module from
  private _target_module: string | null = null;
  get target_module(): string | null {
    return this._target_module;
  }
  // which to load comm target.""")

  /*
    topic = Bytes()

    @default('topic')
    def _default_topic(self):
        return ('comm-%s' % self.comm_id).encode('ascii')
   */
  private _topic: string;
  get topic(): string {
    return this._topic;
  }

  /*

    def handle_close(self, msg):
        """Handle a comm_close message"""
        self.log.debug("handle_close[%s](%s)", self.comm_id, msg)
        if self._close_callback:
            self._close_callback(msg)

   */
  // _close_data = Dict(help="data dict, if any, to be included in comm_close")
  _close_data: Record<string, any> = {};
  // _close_callback = Any()
  protected _close_callback:
    | null
    | ((msg: KernelMessage.ICommCloseMsg) => Promise<void>) = null;
  async handle_close(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    if (this._close_callback) {
      return await this._close_callback(msg);
    }
    console.warn('handle_close without callback NOT IMPLEMENTED', msg);
  }

  // _open_data = Dict(help="data dict, if any, to be included in comm_open")
  _open_data: Record<string, any> = {};

  // _msg_callback = Any()
  _msg_callback: null | ((msg: KernelMessage.ICommMsgMsg) => Promise<void>) = null;

  /*
    def open(self, data=None, metadata=None, buffers=None):
        """Open the frontend-side version of this comm"""
        if data is None:
            data = self._open_data
        comm_manager = getattr(self.kernel, 'comm_manager', None)
        if comm_manager is None:
            raise RuntimeError("Comms cannot be opened without a kernel "
                        "and a comm_manager attached to that kernel.")

        comm_manager.register_comm(self)
        try:
            self._publish_msg('comm_open',
                              data=data, metadata=metadata, buffers=buffers,
                              target_name=self.target_name,
                              target_module=self.target_module,
                              )
            self._closed = False
        except:
            comm_manager.unregister_comm(self)
            raise

  */

  async open(
    data?: Record<string, any>,
    metadata?: Record<string, any>,
    buffers?: (ArrayBuffer | ArrayBufferView)[]
  ): Promise<void> {
    if (!data) {
      data = this._open_data;
    }
    const { comm_manager } = this.kernel;
    comm_manager.register_comm(this);

    try {
      const message = KernelMessage.createMessage<KernelMessage.ICommOpenMsg<'iopub'>>({
        channel: 'iopub',
        msgType: 'comm_open',
        session: this.session,
        metadata: { ...data.metadata, metadata },
        buffers,
        content: {
          data: { ...data.data },
          comm_id: this._comm_id,
          target_name: this._target_name,
          target_module: this._target_module || void 0
        }
      });
      this._sendMessage(message);
      this._closed = false;
    } catch (err) {
      comm_manager.unregister_comm(this);
    }
  }
  /**

    def _publish_msg(self, msg_type, data=None, metadata=None, buffers=None, **keys):
        """Helper for sending a comm message on IOPub"""
        data = {} if data is None else data
        metadata = {} if metadata is None else metadata
        content = json_clean(dict(data=data, comm_id=self.comm_id, **keys))
        self.kernel.session.send(self.kernel.iopub_socket, msg_type,
            content,
            metadata=json_clean(metadata),
            parent=self.kernel._parent_header.get('shell', {}),
            ident=self.topic,
            buffers=buffers,
        )

   */
  /*
  TODO: dispose?

    def __del__(self):
        """trigger close on gc"""
        self.close(deleting=True)

    # publishing messages
*/

  /*

    def close(self, data=None, metadata=None, buffers=None, deleting=False):
        """Close the frontend-side version of this comm"""
        if self._closed:
            # only close once
            return
        self._closed = True
        # nothing to send if we have no kernel
        # can be None during interpreter cleanup
        if not self.kernel:
            return
        if data is None:
            data = self._close_data
        self._publish_msg('comm_close',
            data=data, metadata=metadata, buffers=buffers,
        )
        if not deleting:
            # If deleting, the comm can't be registered
            self.kernel.comm_manager.unregister_comm(self)
*/
  async close(
    data?: Record<string, any>,
    metadata?: Record<string, any>,
    buffers?: (ArrayBuffer | ArrayBufferView)[],
    deleting = false
  ): Promise<void> {
    if (this._closed) {
      return;
    }
    this._closed = true;
    if (!this._kernel) {
      return;
    }
    if (!data) {
      data = this._close_data;
    }
    const message = KernelMessage.createMessage<KernelMessage.ICommCloseMsg<'iopub'>>({
      msgType: 'comm_close',
      channel: 'iopub',
      session: this.session,
      metadata,
      buffers,
      content: {
        data,
        comm_id: this._comm_id
      }
    });
    this._sendMessage(message);
    if (!deleting) {
      this.kernel.comm_manager.unregister_comm(this);
    }
  }

  /*
      def on_close(self, callback):
        """Register a callback for comm_close

        Will be called with the `data` of the close message.

        Call `on_close(None)` to disable an existing callback.
        """
        self._close_callback = callback
  */
  on_close(cb: (msg: any) => Promise<void>): void {
    this._close_callback = cb;
  }

  /*

    def on_msg(self, callback):
        """Register a callback for comm_msg

        Will be called with the `data` of any comm_msg messages.

        Call `on_msg(None)` to disable an existing callback.
        """
        self._msg_callback = callback
 */
  on_msg(callback: (msg: any) => Promise<void>): void {
    this._msg_callback = callback;
  }

  /*
    def send(self, data=None, metadata=None, buffers=None):
        """Send a message to the frontend-side version of this comm"""
        self._publish_msg('comm_msg',
            data=data, metadata=metadata, buffers=buffers,
        )
*/

  get session(): string {
    return (this.kernel as any).parentHeader.session;
  }

  async send(
    data?: Record<string, any>,
    metadata?: Record<string, any>,
    buffers?: (ArrayBuffer | ArrayBufferView)[]
  ): Promise<void> {
    const message = KernelMessage.createMessage<KernelMessage.ICommMsgMsg<'iopub'>>({
      channel: 'iopub',
      msgType: 'comm_msg',
      session: this.session,
      metadata,
      buffers,
      content: {
        data: data || {},
        comm_id: this._comm_id
      }
    });
    this._sendMessage(message);
  }

  /*
    def handle_msg(self, msg):
        """Handle a comm_msg message"""
        self.log.debug("handle_msg[%s](%s)", self.comm_id, msg)
        if self._msg_callback:
            shell = self.kernel.shell
            if shell:
                shell.events.trigger('pre_execute')
            self._msg_callback(msg)
            if shell:
                shell.events.trigger('post_execute')
*/
  async handle_msg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    if (this._msg_callback) {
      this._msg_callback(msg);
    }
  }
}
