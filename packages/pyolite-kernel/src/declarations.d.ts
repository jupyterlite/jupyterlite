declare module '*?raw' {
  const res: string;
  return res;
}

declare module '!!file-loader*' {
  const res: string;
  return res;
}

declare let indexURL: string;
declare let _pipliteWheelUrl: any;
declare let _pipliteUrls: string[];
declare let _disablePyPIFallback: boolean;
declare let pyodide: any;
declare let loadPyodide: any;

// eslint-disable-next-line @typescript-eslint/naming-convention
interface WindowOrWorkerGlobalScope {
  // Add crossOriginIsolation to the global scope. This variable indicates
  // the correct CORS headers are set to enable the use of SharedArrayBuffer.
  // Details: https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated
  // Remove this once we upgrade to typescript >= 4.4
  crossOriginIsolated: boolean | undefined;
}
