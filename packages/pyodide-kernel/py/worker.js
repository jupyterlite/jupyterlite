const BOOTSTRAP =
  'import io, code, sys; sys.stdout = io.StringIO(); sys.stderr = io.StringIO()';

async function loadPyodideAndPackages() {
  await languagePluginLoader;
  await self.pyodide.loadPackage([]);
}

let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async event => {
  await pyodideReadyPromise;
  const data = event.data;
  const keys = Object.keys(data);
  for (let key of keys) {
    if (key !== 'code') {
      self[key] = data[key];
    }
  }
  console.log('Inside worker', data);

  pyodide.runPython(BOOTSTRAP);

  let msgType = 'results';
  let renderHtml = false;
  try {
    let results = await pyodide.runPythonAsync(data.code, ev => {
      console.log(ev);
    });

    let stdo = pyodide.runPython('sys.stdout.getvalue()');
    if (stdo !== '') {
      msgType = 'stdout';
    }
    let stde = pyodide.runPython('sys.stderr.getvalue()');
    if (stde !== '') {
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
      stdout: stdo,
      stderr: stde,
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
