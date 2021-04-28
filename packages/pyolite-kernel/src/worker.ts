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
    await micropip.install('${_pyoliteWheelUrl}')
    import pyolite
  `);
  kernel = pyodide.globals.get('pyolite').kernel_instance;
  interpreter = kernel.interpreter;
  const version = pyodide.globals.get('pyolite').__version__;
  console.log('Pyolite kernel initialized, version', version);
}

/**
 * Recursively convert a Map to a JavaScript object
 * @param The Map object to convert
 */
function mapToObject(map: any) {
  const out: any = {};
  map.forEach((value: any, key: string) => {
    out[key] = value instanceof Map ? mapToObject(value) : value;
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
  console.log('results', results);
  return results;
}

// eslint-disable-next-line
// @ts-ignore: breaks typedoc
const pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event: MessageEvent): Promise<void> => {
  await pyodideReadyPromise;
  const data = event.data;
  console.log('Inside worker', data);

  const stdoutCallback = (stdout: string): void => {
    postMessage({
      parentHeader: data.parentHeader,
      stdout,
      type: 'stdout'
    });
  };

  const stderrCallback = (stderr: string): void => {
    postMessage({
      parentHeader: data.parentHeader,
      stderr,
      type: 'stderr'
    });
  };

  // TODO: support multiple
  const displayCallback = (res: any): void => {
    const bundle = formatResult(res);
    postMessage({
      parentHeader: data.parentHeader,
      bundle,
      type: 'display'
    });
  };

  interpreter.stdout_callback = stdoutCallback;
  interpreter.stderr_callback = stderrCallback;
  kernel.display_publisher.display_callback = displayCallback;

  let res;
  try {
    res = await interpreter.run(data.code);
  } catch (error) {
    postMessage({
      parentheader: data.parentheader,
      type: 'error',
      error
    });
    return;
  }

  const reply = {
    parentheader: data.parentheader,
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
};
