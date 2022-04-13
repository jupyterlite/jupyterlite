import Peer from 'simple-peer/simplepeer.min.js';
const { Int64BE } = require('./int64-buffer.min.js');

export const CHUNK_SIZE = 1024 * 16 - 512; // 16KB - data header
export const TX_SEND_TTL = 1000 * 30; // 30 seconds
export const MAX_BUFFERED_AMOUNT = 64 * 1024; // simple peer value

function concatenate(Constructor, arrays) {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Constructor(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

class SimplePeerExtended extends Peer {
  constructor(opts) {
    super(opts);
    this._opts = opts;
    this._txOrdinal = 0;
    this._rxPackets = [];
    this._txPause = false;
    this.webRTCMessageQueue = [];
    this.webRTCPaused = false;
  }

  encodePacket({ chunk, txOrd, index, length, totalSize, chunkSize }) {
    const encoded = concatenate(Uint8Array, [
      new Uint8Array(new Int64BE(txOrd).toArrayBuffer()), // 8 bytes
      new Uint8Array(new Int64BE(index).toArrayBuffer()), // 8 bytes
      new Uint8Array(new Int64BE(length).toArrayBuffer()), // 8 bytes
      new Uint8Array(new Int64BE(totalSize).toArrayBuffer()), // 8 bytes
      new Uint8Array(new Int64BE(chunkSize).toArrayBuffer()), // 8 bytes
      chunk, // CHUNK_SIZE
    ]);
    return encoded;
  }

  decodePacket(array) {
    return {
      txOrd: new Int64BE(array.slice(0, 8)).toNumber(),
      index: new Int64BE(array.slice(8, 16)).toNumber(),
      length: new Int64BE(array.slice(16, 24)).toNumber(),
      totalSize: new Int64BE(array.slice(24, 32)).toNumber(),
      chunkSize: new Int64BE(array.slice(32, 40)).toNumber(),
      chunk: array.slice(40),
    };
  }

  packetArray(array, size) {
    const txOrd = this._txOrdinal;
    this._txOrdinal++;
    const chunkedArr = [];
    const totalSize = array.length || array.byteLength;
    let index = 0;
    while (index < totalSize) {
      chunkedArr.push(array.slice(index, size + index));
      index += size;
    }
    return chunkedArr.map((chunk, index) => {
      return this.encodePacket({
        chunk,
        txOrd,
        index,
        totalSize,
        length: chunkedArr.length,
        chunkSize: chunk.byteLength,
      });
    });
  }

  _onChannelMessage(event) {
    const { data } = event;
    const packet = this.decodePacket(data);
    if (packet.chunk instanceof ArrayBuffer) {
      packet.chunk = new Uint8Array(packet.chunk);
    }
    if (packet.chunkSize === packet.totalSize) {
      this.push(packet.chunk);
    } else {
      const data = this._rxPackets.filter((p) => p.txOrd === packet.txOrd);
      data.push(packet);
      const indices = data.map((p) => p.index);
      if (new Set(indices).size === packet.length) {
        data.sort(this.sortPacketArray);
        const chunks = concatenate(
          Uint8Array,
          data.map((p) => p.chunk)
        );
        this.push(chunks);
        setTimeout(() => {
          this._rxPackets = this._rxPackets.filter((p) => p.txOrd !== packet.txOrd);
        }, TX_SEND_TTL);
      } else {
        this._rxPackets.push(packet);
      }
    }
  }

  sortPacketArray(a, b) {
    return a.index > b.index ? 1 : -1;
  }
  send(chunk) {
    if (chunk instanceof ArrayBuffer) {
      chunk = new Uint8Array(chunk);
    }
    const chunks = this.packetArray(chunk, CHUNK_SIZE);
    this.webRTCMessageQueue = this.webRTCMessageQueue.concat(chunks);
    if (this.webRTCPaused) {
      return;
    }
    this.sendMessageQueued();
  }

  sendMessageQueued() {
    this.webRTCPaused = false;
    let message = this.webRTCMessageQueue.shift();
    while (message) {
      if (
        this._channel.bufferedAmount &&
        this._channel.bufferedAmount > MAX_BUFFERED_AMOUNT
      ) {
        this.webRTCPaused = true;
        this.webRTCMessageQueue.unshift(message);
        const listener = () => {
          this._channel.removeEventListener('bufferedamountlow', listener);
          this.sendMessageQueued();
        };
        this._channel.addEventListener('bufferedamountlow', listener);
        return;
      }
      try {
        super.send(message);
        message = this.webRTCMessageQueue.shift();
      } catch (error) {
        super.destroy();
        console.warn(error);
      }
    }
  }
}

export default SimplePeerExtended;
