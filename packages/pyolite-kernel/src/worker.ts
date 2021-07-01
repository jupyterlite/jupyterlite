/**
 * Store the kernel and interpreter instances.
 */
// eslint-disable-next-line
// @ts-ignore: breaks typedoc
let kernel: any;
// eslint-disable-next-line
// @ts-ignore: breaks typedoc
let interpreter: any;
// eslint-disable-next-line
// @ts-ignore: breaks typedoc
let stdout_stream: any;
// eslint-disable-next-line
// @ts-ignore: breaks typedoc
let stderr_stream: any;
/**
 * Load Pyodided and initialize the interpreter.
 */
async function loadPyodideAndPackages() {
  // new in 0.17.0 indexURL must be provided
  await loadPyodide({ indexURL });
  await pyodide.loadPackage(['matplotlib']);
  await pyodide.runPythonAsync(`
    import micropip
    await micropip.install([
      'traitlets',
      '${_widgetsnbextensionWheelUrl}',
      '${_nbformatWheelUrl}',
      '${_ipykernelWheelUrl}'
    ])
    await micropip.install([
      '${_pyoliteWheelUrl}'
    ]);
    await micropip.install('ipython');
    import pyolite
  `);
  kernel = pyodide.globals.get('pyolite').kernel_instance;
  stdout_stream = pyodide.globals.get('pyolite').stdout_stream;
  stderr_stream = pyodide.globals.get('pyolite').stderr_stream;
  interpreter = kernel.interpreter;
  interpreter.send_comm = sendComm;
  const version = pyodide.globals.get('pyolite').__version__;
  console.log('Pyolite kernel initialized, version', version);
}

/**
 * Recursively convert a Map to a JavaScript object
 * @param The Map object to convert
 */
function mapToObject(obj: any) {
  const out: any = obj instanceof Array ? [] : {};
  obj.forEach((value: any, key: string) => {
    out[key] =
      value instanceof Map || value instanceof Array ? mapToObject(value) : value;
  });
  return out;
}

/**
 * Format the response from the Pyodide evaluation.
 *
 * @param res The result object from the Pyodide evaluation
 */
function formatResult(res: any): any {
  if (!pyodide.isPyProxy(res)) {
    return res;
  }
  // TODO: this is a bit brittle
  const m = res.toJs();
  const results = mapToObject(m);
  return results;
}

// eslint-disable-next-line
// @ts-ignore: breaks typedoc
const pyodideReadyPromise = loadPyodideAndPackages();

/**
 * Send a comm message to the front-end.
 *
 * @param type The type of the comm message.
 * @param content The content.
 * @param metadata The metadata.
 * @param ident The ident.
 * @param buffers The binary buffers.
 */
async function sendComm(
  type: string,
  content: any,
  metadata: any,
  ident: any,
  buffers: any
) {
  postMessage({
    type: type,
    content: formatResult(content),
    metadata: formatResult(metadata),
    ident: formatResult(ident),
    buffers: formatResult(buffers)
  });
}

/**
 * Execute code with the interpreter.
 *
 * @param content The incoming message with the code to execute.
 */
async function execute(content: any) {
  const publishExecutionResult = (
    prompt_count: any,
    data: any,
    metadata: any
  ): void => {
    const bundle = {
      execution_count: formatResult(prompt_count),
      data: formatResult(data),
      metadata: formatResult(metadata)
    };
    postMessage({
      parentHeader: content.parentHeader,
      bundle,
      type: 'execute_result'
    });
  };

  const clearOutputCallback = (wait: boolean): void => {
    const bundle = {
      wait: formatResult(wait)
    };
    postMessage({
      parentHeader: content.parentHeader,
      bundle,
      type: 'clear_output'
    });
  };

  const displayDataCallback = (data: any, metadata: any, transient: any): void => {
    const bundle = {
      data: formatResult(data),
      metadata: formatResult(metadata),
      transient: formatResult(transient)
    };
    postMessage({
      parentHeader: content.parentHeader,
      bundle,
      type: 'display_data'
    });
  };

  const updateDisplayDataCallback = (
    data: any,
    metadata: any,
    transient: any
  ): void => {
    const bundle = {
      data: formatResult(data),
      metadata: formatResult(metadata),
      transient: formatResult(transient)
    };
    postMessage({
      parentHeader: content.parentHeader,
      bundle,
      type: 'update_display_data'
    });
  };

  const publishStreamCallback = (name: any, text: any): void => {
    const bundle = {
      name: formatResult(name),
      text: formatResult(text)
    };
    postMessage({
      parentHeader: content.parentHeader,
      bundle,
      type: 'stream'
    });
  };

  stdout_stream.publish_stream_callback = publishStreamCallback;
  stderr_stream.publish_stream_callback = publishStreamCallback;
  interpreter.display_pub.clear_output_callback = clearOutputCallback;
  interpreter.display_pub.display_data_callback = displayDataCallback;
  interpreter.display_pub.update_display_data_callback = updateDisplayDataCallback;
  interpreter.displayhook.publish_execution_result = publishExecutionResult;

  let res;
  try {
    res = await interpreter.run(content.code);
  } catch (error) {
    postMessage({
      parentheader: content.parentheader,
      type: 'error',
      error
    });
    return;
  }

  const reply = {
    parentheader: content.parentheader,
    type: 'reply'
  };

  if (!res) {
    postMessage(reply);
    return;
  }

  try {
    const results = formatResult(res);
    postMessage({
      ...reply,
      results
    });
  } catch (e) {
    postMessage(reply);
  }
}
/**
 * Complete the code submitted by a user.
 *
 * @param content The incoming message with the code to complete.
 */
function complete(content: any) {
  const res = interpreter.complete(content.code.substring(0, content.cursor_pos));
  const results = formatResult(res);

  const reply = {
    parentheader: content.parentheader,
    type: 'reply',
    results: {
      matches: results[0],
      cursor_start: results[1],
      cursor_end: content.cursor_pos,
      status: 'ok'
    }
  };

  postMessage(reply);
}

/**
 * Respond to the commInfoRequest.
 *
 * @param content The incoming message with the comm target name.
 */
function commInfo(content: any) {
  const res = kernel.comm_info(content.target_name);
  const results = formatResult(res);

  const reply = {
    parentheader: content.parentheader,
    type: 'reply',
    results: {
      comms: results,
      status: 'ok'
    }
  };

  postMessage(reply);
}

/**
 * Respond to the commOpen.
 *
 * @param content The incoming message with the comm open.
 */
function commOpen(content: any) {
  const res = kernel.comm_manager.comm_open(pyodide.toPy(content));
  const results = formatResult(res);

  const reply = {
    parentheader: content.parentheader,
    type: 'reply',
    results
  };

  postMessage(reply);
}

/**
 * Respond to the commMsg.
 *
 * @param content The incoming message with the comm msg.
 */
function commMsg(content: any) {
  const res = kernel.comm_manager.comm_msg(pyodide.toPy(content));
  const results = formatResult(res);

  const reply = {
    parentheader: content.parentheader,
    type: 'reply',
    results
  };

  postMessage(reply);
}

/**
 * Respond to the commClose.
 *
 * @param content The incoming message with the comm close.
 */
function commClose(content: any) {
  const res = kernel.comm_manager.comm_close(pyodide.toPy(content));
  const results = formatResult(res);

  const reply = {
    parentheader: content.parentheader,
    type: 'reply',
    results
  };

  postMessage(reply);
}

/**
 * Process a message sent to the worker.
 *
 * @param event The message event to process
 */
self.onmessage = async (event: MessageEvent): Promise<void> => {
  await pyodideReadyPromise;
  const data = event.data;

  const messageType = data.type;
  const messageContent = data.data;

  switch (messageType) {
    case 'execute-request':
      console.log('Perform execution inside worker', data);
      return execute(messageContent);

    case 'complete-request':
      return complete(messageContent);

    case 'comm-info-request':
      return commInfo(messageContent);

    case 'comm-open':
      return commOpen(messageContent);

    case 'comm-msg':
      return commMsg(messageContent);

    case 'comm-close':
      return commClose(messageContent);

    default:
      break;
  }
};
