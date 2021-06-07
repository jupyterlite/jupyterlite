import { IKernel, ICommManager } from './tokens';
import { Comm } from './comm';

/**
 * A Default CommManager
 *
 * Each kernel will get its own CommManager.
 *
 * Roughly implements an API compatible with the `ipykernel.CommManager`.
 *
 * _Doesn't_ implement full traitlets observability, but most of the data is in
 * `Dict`s anyway.
 *
 * @see https://github.com/ipython/ipykernel/blob/v5.2.1/ipykernel/comm/manager.py
 *
 */
export class DefaultCommManager implements ICommManager {
  private _kernel: IKernel;
  private _sendMessage: IKernel.SendMessage;
  private _comms = new Map<string, ICommManager.IComm>();
  private _targets = new Map<string, ICommManager.ITarget>();

  constructor(options: ICommManager.IOptions) {
    this._kernel = options.kernel;
    this._sendMessage = options.sendMessage;
  }

  get kernel() {
    return this._kernel;
  }

  get targets() {
    return this._targets;
  }

  get comms() {
    return this._comms;
  }

  /*
    def register_target(self, target_name, f):
        """Register a callable f for a given target name

        f will be called with two arguments when a comm_open message is received with `target`:

        - the Comm instance
        - the `comm_open` message itself.

        f can be a Python callable or an import string for one.
        """
        if isinstance(f, string_types):
            f = import_item(f)

  */
  register_target(target_name: string, f: ICommManager.ITarget | string) {
    if (typeof f === 'string') {
      throw new ICommManager.APINotImplemented(
        'creating a comm by import not supported'
      );
    }
    this._targets.set(target_name, f);
  }

  /*
    def unregister_target(self, target_name, f):
        """Unregister a callable registered with register_target"""
        return self.targets.pop(target_name)
  */
  unregister_target(
    target_name: string,
    f: ICommManager.ITarget
  ): ICommManager.ITarget | null {
    const t = this._targets.get(target_name);
    if (!t) {
      throw new Error('no target. TOOD: better error');
    }
    this._targets.delete(target_name);
    return t;
  }

  /*
    def register_comm(self, comm):
        """Register a new comm"""
        comm_id = comm.comm_id
        comm.kernel = self.kernel
        self.comms[comm_id] = comm
        return comm_id
  */
  register_comm(comm: ICommManager.IComm): string {
    const { comm_id } = comm;
    comm.kernel = this.kernel;
    this._comms.set(comm_id, comm);
    return comm_id;
  }
  /*
    def unregister_comm(self, comm):
        """Unregister a comm, and close its counterpart"""
        # unlike get_comm, this should raise a KeyError
        comm = self.comms.pop(comm.comm_id)
  */
  unregister_comm(comm: ICommManager.IComm) {
    this._comms.delete(comm.comm_id);
  }
  /*
    def get_comm(self, comm_id):
        """Get a comm with a particular id

        Returns the comm if found, otherwise None.

        This will not raise an error,
        it will log messages if the comm cannot be found.
        """
        try:
            return self.comms[comm_id]
        except KeyError:
            self.log.warning("No such comm: %s", comm_id)
            if self.log.isEnabledFor(logging.DEBUG):
                # don't create the list of keys if debug messages aren't enabled
                self.log.debug("Current comms: %s", list(self.comms.keys()))
*/
  get_comm(comm_id: string): ICommManager.IComm {
    const comm = this._comms.get(comm_id);

    if (!comm) {
      throw new Error(`don't have that comm. TODO: better error sublcass`);
    }

    return comm;
  }

  /*
    # Message handlers
    def comm_open(self, stream, ident, msg):
        """Handler for comm_open messages"""
        content = msg['content']
        comm_id = content['comm_id']
        target_name = content['target_name']
        f = self.targets.get(target_name, None)
        comm = Comm(comm_id=comm_id,
                    primary=False,
                    target_name=target_name,
        )
        self.register_comm(comm)
        if f is None:
            self.log.error("No such comm target registered: %s", target_name)
        else:
            try:
                f(comm, msg)
                return
            except Exception:
                self.log.error("Exception opening comm with target: %s", target_name, exc_info=True)

        # Failure.
        try:
            comm.close()
        except:
            self.log.error("""Could not close comm during `comm_open` failure
                clean-up.  The comm may not have been opened yet.""", exc_info=True)
  */
  async comm_open(msg: any): Promise<void> {
    const { content } = msg;
    const { comm_id, target_name } = content;
    const f = this._targets.get(target_name);
    const comm = new Comm({
      kernel: this.kernel,
      comm_id,
      primary: false,
      target_name,
      sendMessage: this._sendMessage
    });
    this.register_comm(comm);
    if (f) {
      try {
        await f(comm, msg);
        return;
      } catch (err) {
        console.error(err);
        console.error('Exception opening comm with target', target_name);
      }
    }

    try {
      await comm.close();
    } catch (err) {
      console.error(
        'Could not close comm during `comm_open` failure clean-up.  The comm may not have been opened yet.'
      );
    }
  }

  /*
    def comm_msg(self, stream, ident, msg):
        """Handler for comm_msg messages"""
        content = msg['content']
        comm_id = content['comm_id']
        comm = self.get_comm(comm_id)
        if comm is None:
            return

        try:
            comm.handle_msg(msg)
        except Exception:
            self.log.error('Exception in comm_msg for %s', comm_id, exc_info=True)

  */
  async comm_msg(msg: any): Promise<void> {
    const { content } = msg;
    const { comm_id } = content;
    const comm = this.get_comm(comm_id);
    if (!comm) {
      return;
    }

    try {
      await comm.handle_msg(msg);
    } catch (err) {
      console.error('Exception in comm_msg for', comm_id);
      console.trace();
    }
  }
  /*
    def comm_close(self, stream, ident, msg):
        """Handler for comm_close messages"""
        content = msg['content']
        comm_id = content['comm_id']
        comm = self.get_comm(comm_id)
        if comm is None:
            return

        self.comms[comm_id]._closed = True
        del self.comms[comm_id]

        try:
            comm.handle_close(msg)
        except Exception:
            self.log.error('Exception in comm_close for %s', comm_id, exc_info=True)

  */
  async comm_close(msg: any): Promise<void> {
    const { content } = msg;
    const { comm_id } = content;
    const comm = this.get_comm(comm_id);
    if (!comm) {
      return;
    }
    comm._closed = true;
    this._comms.delete(comm_id);

    try {
      await comm.handle_close(msg);
    } catch (err) {
      console.error(
        `Exception in comm_close for %s', comm_id, exc_info=True)`,
        comm_id
      );
      console.trace();
    }
  }
}
