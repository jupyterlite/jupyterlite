/**
 * Store the kernel and interpreter instances.
 */
let kernel: any;
let interpreter: any;

/**
 * Load Pyodided and initialize the interpreter.
 */
async function loadPyodideAndPackages() {
  // new in 0.17.0 indexURL must be provided
  await loadPyodide({ indexURL });
  await pyodide.loadPackage([]);
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
  const results = {
    data: Object.fromEntries(m.get('data')),
    metadata: Object.fromEntries(m.get('metadata'))
  };
  if (results.data['application/json']) {
    results.data['application/json'] = JSON.parse(results.data['application/json']);
  }
  console.log('results', results);
  return results;
}

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
  } catch (err) {
    postMessage({
      parentheader: data.parentheader,
      type: 'stderr',
      stderr: err
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
