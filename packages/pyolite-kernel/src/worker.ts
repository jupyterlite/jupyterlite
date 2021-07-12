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
      'importhook',
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
      execution_count: prompt_count,
      data: formatResult(data),
      metadata: formatResult(metadata)
    };
    postMessage({
      parentHeader: formatResult(kernel._parent_header['header']),
      bundle,
      type: 'execute_result'
    });
  };

  const publishExecutionError = (ename: any, evalue: any, traceback: any): void => {
    const bundle = {
      ename: ename,
      evalue: evalue,
      traceback: traceback
    };
    postMessage({
      parentHeader: formatResult(kernel._parent_header['header']),
      bundle,
      type: 'execute_error'
    });
  };

  const clearOutputCallback = (wait: boolean): void => {
    const bundle = {
      wait: formatResult(wait)
    };
    postMessage({
      parentHeader: formatResult(kernel._parent_header['header']),
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
      parentHeader: formatResult(kernel._parent_header['header']),
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
      parentHeader: formatResult(kernel._parent_header['header']),
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
      parentHeader: formatResult(kernel._parent_header['header']),
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

  const res = await kernel.run(content.code);
  const results = formatResult(res);

  if (results['status'] === 'error') {
    publishExecutionError(results['ename'], results['evalue'], results['traceback']);
  }

  return results;
}
/**
 * Complete the code submitted by a user.
 *
 * @param content The incoming message with the code to complete.
 */
function complete(content: any) {
  const res = kernel.complete(content.code, content.cursor_pos);
  const results = formatResult(res);
  return results;
}

/**
 * Respond to the commInfoRequest.
 *
 * @param content The incoming message with the comm target name.
 */
function commInfo(content: any) {
  const res = kernel.comm_info(content.target_name);
  const results = formatResult(res);

  return {
    comms: results,
    status: 'ok'
  };
}

/**
 * Respond to the commOpen.
 *
 * @param content The incoming message with the comm open.
 */
function commOpen(content: any) {
  const res = kernel.comm_manager.comm_open(pyodide.toPy(content));
  const results = formatResult(res);

  return results;
}

/**
 * Respond to the commMsg.
 *
 * @param content The incoming message with the comm msg.
 */
function commMsg(content: any) {
  const res = kernel.comm_manager.comm_msg(pyodide.toPy(content));
  const results = formatResult(res);

  return results;
}

/**
 * Respond to the commClose.
 *
 * @param content The incoming message with the comm close.
 */
function commClose(content: any) {
  const res = kernel.comm_manager.comm_close(pyodide.toPy(content));
  const results = formatResult(res);

  return results;
}

/**
 * Process a message sent to the worker.
 *
 * @param event The message event to process
 */
self.onmessage = async (event: MessageEvent): Promise<void> => {
  await pyodideReadyPromise;
  const data = event.data;

  let results;
  const messageType = data.type;
  const messageContent = data.data;
  kernel._parent_header = pyodide.toPy(data.parent);

  switch (messageType) {
    case 'execute-request':
      console.log('Perform execution inside worker', data);
      results = await execute(messageContent);
      break;

    case 'complete-request':
      results = complete(messageContent);
      break;

    case 'comm-info-request':
      results = commInfo(messageContent);
      break;

    case 'comm-open':
      results = commOpen(messageContent);
      break;

    case 'comm-msg':
      results = commMsg(messageContent);
      break;

    case 'comm-close':
      results = commClose(messageContent);
      break;

    default:
      break;
  }

  const reply = {
    parentHeader: data.parent['header'],
    type: 'reply',
    results
  };

  postMessage(reply);
};
