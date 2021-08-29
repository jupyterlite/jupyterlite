declare module '*?raw' {
  const res: string;
  return res;
}

declare module '*.whl' {
  const res: string;
  return res;
}

declare let indexURL: string;
declare let micropipUrls: string[];
declare let pyodide: any;
declare let loadPyodide: any;
