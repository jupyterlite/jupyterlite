addEventListener('message', ({ data }) => {
  languagePluginLoader.then(() => {
    pyodide
      .loadPackage([])
      .then(() => {
        const keys = Object.keys(data);
        for (let key of keys) {
          if (key !== 'code') {
            self[key] = data[key];
          }
        }
        console.log('Inside worker', data);
        pyodide.runPython(
          'import io, code, sys; sys.stdout = io.StringIO(); sys.stderr = io.StringIO()'
        );
        let msgType = 'results';
        let renderHtml = false;
        pyodide
          .runPythonAsync(data.code, ev => {
            console.log(ev);
          })
          .then(results => {
            let stdo = pyodide.runPython('sys.stdout.getvalue()');
            if (stdo !== '') {
              msgType = 'stdout';
            }
            let stde = pyodide.runPython('sys.stderr.getvalue()');
            if (stde !== '') {
              msgType = 'stderr';
            }
            // hack to support rendering of pandas dataframes.
            if (
              typeof results === 'function' &&
              pyodide._module.PyProxy.isPyProxy(results)
            ) {
              try {
                results = results._repr_html_();
                renderHtml = true;
              } catch {
                results = String(results);
              }
            }
            postMessage({
              result: results,
              parentHeader: data.parentHeader,
              stdout: stdo,
              stderr: stde,
              type: msgType,
              msg: data.message,
              renderHtml: renderHtml
            });
          })
          .catch(error => {
            msgType = 'stderr';
            postMessage({ stderr: error, type: msgType, msg: data.message });
          });
      })
      .catch(error => {
        msgType = 'stderr';
        postMessage({
          error: true,
          stderr: error,
          type: msgType,
          msg: data.message
        });
      });
  });
});
