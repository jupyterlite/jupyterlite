declare module '!!raw-loader!*' {}

declare module '*.svg' {
  const value: string;
  export default value;
}
