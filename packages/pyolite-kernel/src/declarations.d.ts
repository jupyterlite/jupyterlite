declare module '*?raw' {
  const res: string;
  return res;
}

declare module '!!file-loader*' {
  const res: string;
  return res;
}

declare let baseURL: string;
declare let indexURL: string;
declare let _pipliteWheelUrl: any;
declare let _pipliteUrls: string[];
declare let _disablePyPIFallback: boolean;
declare let pyodide: any;
declare let loadPyodide: any;
