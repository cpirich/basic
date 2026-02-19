/// <reference types="vite/client" />
declare module "*.bas?raw" {
  const content: string;
  export default content;
}
