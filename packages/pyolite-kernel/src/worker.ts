/**
 * Store the kernel and interpreter instances.
 */
// eslint-disable-next-line
// @ts-ignore: breaks typedoc
let kernel: any;
// eslint-disable-next-line
// @ts-ignore: breaks typedoc
let interpreter: any;

/**
 * Load Pyodided and initialize the interpreter.
 */
async function loadPyodideAndPackages() {
  // new in 0.17.0 indexURL must be provided
  await loadPyodide({ indexURL });
  await pyodide.loadPackage(['matplotlib']);
  await pyodide.runPythonAsync(`
    import micropip
    # Doing it in two times is important, otherwise ipywidgets doesn't pick our mocks
    await micropip.install([
      'traitlets',
      '${_widgetsnbextensionWheelUrl}',
      '${_nbformatWheelUrl}',
      '${_ipykernelWheelUrl}'
    ])
    await micropip.install([
      'ipywidgets',
      '${_pyoliteWheelUrl}'
    ]);
    import pyolite
  `);
  kernel = pyodide.globals.get('pyolite').kernel_instance;
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
  const stdoutCallback = (stdout: string): void => {
    postMessage({
      parentHeader: content.parentHeader,
      stdout,
      type: 'stdout'
    });
  };

  const stderrCallback = (stderr: string): void => {
    postMessage({
      parentHeader: content.parentHeader,
      stderr,
      type: 'stderr'
    });
  };

  // TODO: support multiple
  const displayCallback = (res: any): void => {
    const bundle = formatResult(res);
    postMessage({
      parentHeader: content.parentHeader,
      bundle,
      type: 'display'
    });
  };

  interpreter.stdout_callback = stdoutCallback;
  interpreter.stderr_callback = stderrCallback;
  kernel.display_publisher.display_callback = displayCallback;

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
    type: 'results'
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
    type: 'results',
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
 * Process a message sent to the worker.
 *
 * @param event The message event to process
 */
self.onmessage = async (event: MessageEvent): Promise<void> => {
  await pyodideReadyPromise;
  const data = event.data;
  console.log('Inside worker', data);

  const messageType = data.type;
  const messageContent = data.data;

  switch (messageType) {
    case 'execute-request':
      return execute(messageContent);

    case 'complete-request':
      return complete(messageContent);

    default:
      break;
  }
};
