// Temporary JSX typings to satisfy TypeScript in environments without @types/react installed.
// Prefer installing @types/react and @types/react-dom for accurate typing.

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
