# This is more or less a copy of ipykernel's comm implementation

import uuid

from traitlets.utils.importstring import import_item


class Comm:
    def __init__(
        self,
        target_name="",
        data=None,
        metadata=None,
        buffers=None,
        primary=True,
        target_module=None,
        comm_id=None,
        **kwargs
    ):
        from IPython.core.getipython import get_ipython

        self.target_name = target_name
        self.target_module = target_module
        self.comm_id = comm_id if comm_id is not None else uuid.uuid4().hex
        self.topic = ("comm-%s" % self.comm_id).encode("ascii")
        self.kernel = get_ipython().kernel
        self._msg_callback = []
        self._close_callback = []
        self._closed = True
        self.primary = primary
        if self.kernel:
            if self.primary:
                # I am primary, open my peer.
                self.open(data=data, metadata=metadata, buffers=buffers)
            else:
                self._closed = False

    def _publish_msg(self, msg_type, data=None, metadata=None, buffers=None, **keys):
        """Helper for sending a comm message on IOPub"""
        data = {} if data is None else data
        metadata = {} if metadata is None else metadata
        content = dict(data=data, comm_id=self.comm_id, **keys)
        if buffers is not None:
            buffers = [(b.tobytes() if hasattr(b, "tobytes") else b) for b in buffers]

        self.kernel.interpreter.send_comm(
            msg_type,
            content,
            metadata,
            self.topic,
            buffers,
        )

    def __del__(self):
        """trigger close on gc"""
        self.close(deleting=True)

    # publishing messages

    def open(self, data=None, metadata=None, buffers=None):
        """Open the frontend-side version of this comm"""
        comm_manager = getattr(self.kernel, "comm_manager", None)
        if comm_manager is None:
            raise RuntimeError(
                "Comms cannot be opened without a kernel "
                "and a comm_manager attached to that kernel."
            )

        comm_manager.register_comm(self)
        try:
            self._publish_msg(
                "comm_open",
                data=data,
                metadata=metadata,
                buffers=buffers,
                target_name=self.target_name,
                target_module=self.target_module,
            )
            self._closed = False
        except:
            comm_manager.unregister_comm(self)
            raise

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
        self._publish_msg(
            "comm_close",
            data=data,
            metadata=metadata,
            buffers=buffers,
        )
        if not deleting:
            # If deleting, the comm can't be registered
            self.kernel.comm_manager.unregister_comm(self)

    def send(self, data=None, metadata=None, buffers=None):
        """Send a message to the frontend-side version of this comm"""
        self._publish_msg(
            "comm_msg",
            data=data,
            metadata=metadata,
            buffers=buffers,
        )

    # registering callbacks

    def on_close(self, callback):
        """Register a callback for comm_close
        Will be called with the `data` of the close message.
        Call `on_close(None)` to disable an existing callback.
        """
        self._close_callback = callback

    def on_msg(self, callback):
        """Register a callback for comm_msg
        Will be called with the `data` of any comm_msg messages.
        Call `on_msg(None)` to disable an existing callback.
        """
        self._msg_callback = callback

    # handling of incoming messages

    def handle_close(self, msg):
        """Handle a comm_close message"""
        if self._close_callback:
            self._close_callback(msg)

    def handle_msg(self, msg):
        """Handle a comm_msg message"""
        if self._msg_callback:
            self._msg_callback(msg)


class CommManager:
    def __init__(self, kernel=None, comms=None, targets=None):
        self.kernel = kernel
        self.comms = comms if comms is not None else {}
        self.targets = targets if targets is not None else {}

    def register_target(self, target_name, f):
        """Register a callable f for a given target name
        f will be called with two arguments when a comm_open message is received with `target`:
        - the Comm instance
        - the `comm_open` message itself.
        f can be a Python callable or an import string for one.
        """
        if isinstance(f, str):
            f = import_item(f)

        self.targets[target_name] = f

    def unregister_target(self, target_name, f):
        """Unregister a callable registered with register_target"""
        return self.targets.pop(target_name)

    def register_comm(self, comm):
        """Register a new comm"""
        comm_id = comm.comm_id
        comm.kernel = self.kernel
        self.comms[comm_id] = comm
        return comm_id

    def unregister_comm(self, comm):
        """Unregister a comm, and close its counterpart"""
        # unlike get_comm, this should raise a KeyError
        comm = self.comms.pop(comm.comm_id)

    def get_comm(self, comm_id):
        """Get a comm with a particular id
        Returns the comm if found, otherwise None.
        This will not raise an error,
        it will log messages if the comm cannot be found.
        """
        try:
            return self.comms[comm_id]
        except KeyError:
            pass

    # Message handlers
    def comm_open(self, msg):
        """Handler for comm_open messages"""
        content = msg["content"]
        comm_id = content["comm_id"]
        target_name = content["target_name"]
        f = self.targets.get(target_name, None)
        comm = Comm(
            comm_id=comm_id,
            primary=False,
            target_name=target_name,
        )
        self.register_comm(comm)
        if f is not None:
            f(comm, msg)

    def comm_msg(self, msg):
        """Handler for comm_msg messages"""
        content = msg["content"]
        comm_id = content["comm_id"]
        comm = self.get_comm(comm_id)
        if comm is None:
            return

        comm.handle_msg(msg)

    def comm_close(self, msg):
        """Handler for comm_close messages"""
        content = msg["content"]
        comm_id = content["comm_id"]
        comm = self.get_comm(comm_id)
        if comm is None:
            return

        self.comms[comm_id]._closed = True
        del self.comms[comm_id]

        comm.handle_close(msg)
