import { KernelMessage } from '@jupyterlab/services';

import { WebSocket } from 'mock-socket';

// @ts-ignore: No type definitions for this
import { createMessageEvent } from 'mock-socket/src/event/factory';

// @ts-ignore: No type definitions for this
import networkBridge from 'mock-socket/src/network-bridge';

// @ts-ignore: No type definitions for this
import delay from 'mock-socket/src/helpers/delay';


/**
 * A fake socket that doesn't require serialization/deserialization of messages
 */
export class KernelSocket extends WebSocket {

    /*
     * Send an IMessage through the socket
     */
    sendMessage (data: KernelMessage.IMessage) {
        if (this.readyState === WebSocket.CLOSING || this.readyState === WebSocket.CLOSED) {
            throw new Error('WebSocket is already in CLOSING or CLOSED state');
        }

        const messageEvent = createMessageEvent({
            type: 'server::message',
            origin: this.url,
            data: data
        });

        const server = networkBridge.serverLookup(this.url);

        if (server) {
            delay(() => {
                this.dispatchEvent(messageEvent);
            }, server);
        }
    }

}
