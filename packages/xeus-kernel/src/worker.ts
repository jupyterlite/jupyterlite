import createXeusModule from './xeus_lua';

// We alias self to ctx and give it our newly created type
const ctx: Worker = self as any;
let raw_xkernel: any;
let raw_xserver: any;
let _parentHeader: any;

async function async_get_input_function(prompt: string) {
  prompt = typeof prompt === 'undefined' ? '' : prompt;
  await sendInputRequest({ prompt: prompt, password: false });
  const replyPromise = new Promise(resolve => {
    resolveInputReply = resolve;
  });
  const result: any = await replyPromise;
  return result['value'];
}

async function sendInputRequest(content: any) {
  ctx.postMessage({
    parentHeader: _parentHeader,
    content,
    type: 'special_input_request'
  });
}

// eslint-disable-next-line
// @ts-ignore: breaks typedoc
ctx.async_get_input_function = async_get_input_function;

// eslint-disable-next-line
// @ts-ignore: breaks typedoc
let resolveInputReply: any;

function postMessageToMain(message: any, channel: string) {
  message.channel = channel;
  message.type = message.header.msg_type;
  message.parent_header = _parentHeader;
  ctx.postMessage(message);
}

async function loadCppModule(moduleFactory: any): Promise<any> {
  const options: any = {};

  return moduleFactory(options).then((Module: any) => {
    raw_xkernel = new Module.xkernel();
    raw_xserver = raw_xkernel.get_server();

    raw_xserver!.register_js_callback((type: string, channel: number, data: any) => {
      data = JSON.parse(data);
      switch (type) {
        case 'shell': {
          postMessageToMain(data, 'shell');
          break;
        }
        case 'control': {
          throw new Error('send_control is not yet implemented');
          break;
        }
        case 'stdin': {
          postMessageToMain(data, 'stdin');
          break;
        }
        case 'publish': {
          // TODO ask what to do with channel
          postMessageToMain(data, 'iopub');
          break;
        }
      }
    });
    raw_xkernel!.start();
  });
}

const loadCppModulePromise = loadCppModule(createXeusModule);

ctx.onmessage = async (event: MessageEvent): Promise<void> => {
  await loadCppModulePromise;

  const data = event.data;
  const msg = data.msg;
  const msg_type = msg.header.msg_type;

  if (msg_type !== 'input_reply') {
    _parentHeader = data.parent['header'];
  }

  if (msg_type === 'input_reply') {
    resolveInputReply(msg.content);
  } else {
    const str_msg = JSON.stringify(msg);
    raw_xserver!.notify_listener(str_msg, msg.channel);
  }
};
