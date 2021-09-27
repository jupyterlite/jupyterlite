export class XeusWorkerHandle {
  raw_xkernel: any;
  raw_xserver: any;
  _parentHeader: any;
  _sessionId: any;
  _postMessage: any;
  worker: Worker;
  constructor(worker: Worker, postMessage: any) {
    this.worker = worker;
    this._postMessage = postMessage;
  }

  async postMessageToWorker(message: any, channel: string) {
    message.channel = channel;
    message.type = message.header.msg_type;
    message.parent_header = this._parentHeader;
    this.worker.postMessage(message);
  }

  async loadCppModule(moduleFactory: any): Promise<any> {
    const options: any = {};

    return moduleFactory(options).then((Module: any) => {
      this.raw_xkernel = new Module.xkernel();
      this.raw_xserver = this.raw_xkernel.get_server();

      this.raw_xserver!.register_js_callback(
        (type: string, channel: number, data: any) => {
          data = JSON.parse(data);
          switch (type) {
            case 'shell': {
              this.postMessageToWorker(data, 'shell');
              break;
            }
            case 'control': {
              throw new Error('send_control is not yet implemented');
              break;
            }
            case 'stdin': {
              this.postMessageToWorker(data, 'stdin');
              break;
            }
            case 'publish': {
              // TODO ask what to do with channel
              this.postMessageToWorker(data, 'iopub');
              break;
            }
          }
        }
      );
      this.raw_xkernel!.start();
    });
  }
}
