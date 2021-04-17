const BOOTSTRAP =
  'import io, code, sys; sys.stdout = io.StringIO(); sys.stderr = io.StringIO()';

async function loadPyodideAndPackages() {
  await languagePluginLoader;
  await pyodide.loadPackage([]);
}

const pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event: MessageEvent): Promise<void> => {
  await pyodideReadyPromise;
  const data = event.data;
  console.log('Inside worker', data);

  // if this is the init event
  if (data.type === 'init') {
    const pyoliteWheelUrl = data.pyoliteWheelUrl;
    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install('${pyoliteWheelUrl}')
      import pyolite
    `);
    postMessage({});
    return;
  }

  await pyodide.runPythonAsync(BOOTSTRAP);

  let msgType = 'results';
  let renderHtml = false;
  try {
    let results = await pyodide.runPythonAsync(data.code, (ev: any) => {
      console.log(ev);
    });

    const stdout = pyodide.runPython('sys.stdout.getvalue()');
    if (stdout !== '') {
      msgType = 'stdout';
    }
    const stderr = pyodide.runPython('sys.stderr.getvalue()');
    if (stderr !== '') {
      msgType = 'stderr';
    }
    // hack to support rendering of pandas dataframes.
    if (pyodide._module.PyProxy.isPyProxy(results)) {
      try {
        results = results._repr_html_();
        renderHtml = true;
      } catch {
        results = String(results);
      }
    }
    const msg = {
      result: results,
      parentHeader: data.parentHeader,
      stdout,
      stderr,
      type: msgType,
      msg: data.message,
      renderHtml: renderHtml
    };
    postMessage(msg);
  } catch (error) {
    msgType = 'stderr';
    postMessage({ stderr: error, type: msgType, msg: data.message });
  }
};
