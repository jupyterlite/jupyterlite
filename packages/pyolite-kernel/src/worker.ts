/**
 * Store the kernel and interpreter instances.
 */
let kernel: any;
let interpreter: any;

/**
 * Load Pyodided and initialize the interpreter.
 */
async function loadPyodideAndPackages() {
  await loadPyodide();
  await pyodide.loadPackage([]);
  await pyodide.runPythonAsync(`
    import micropip
    await micropip.install('${_pyoliteWheelUrl}')
    import pyolite
  `);
  kernel = pyodide.globals.get('pyolite').kernel;
  interpreter = kernel.interpreter;
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

  interpreter.stdout_callback = stdoutCallback;
  interpreter.stderr_callback = stderrCallback;

  const results = await interpreter.run(data.code);

  console.log('results', results);

  // TODO: handle different types of responses:
  // - execute finished -> should resolve the promise in the JS part of the kernel
  // - displays -> postmessage with the parent header
  postMessage({});
};
