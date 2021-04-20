declare module '*?raw' {
  const res: string;
  return res;
}

declare module '*.whl' {
  const res: string;
  return res;
}

declare let pyodide: any;
declare let languagePluginLoader: any;
declare let _pyoliteWheelUrl: string;
