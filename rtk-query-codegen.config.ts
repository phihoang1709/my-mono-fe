import type { ConfigFile } from '@rtk-query/codegen-openapi';

const schemaFile =
  process.env.VITE_API_OPENAPI_URL && process.env.VITE_API_OPENAPI_URL.length > 0
    ? `${process.env.VITE_API_OPENAPI_URL}`
    : 'openapi.json';
  
const config: ConfigFile = {
  schemaFile,
  apiFile: './libs/shared/state/src/api/baseApi.ts',
  apiImport: 'baseApi',
  outputFile: './libs/shared/state/src/api/generatedApi.ts',
  exportName: 'generatedApi',
  hooks: true,
};

export default config;
