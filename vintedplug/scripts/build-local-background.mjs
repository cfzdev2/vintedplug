import {build} from "vite";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const transformersRequire=createRequire(require.resolve("@huggingface/transformers"));
const ort=JSON.parse(readFileSync(resolve(dirname(transformersRequire.resolve("onnxruntime-web/webgpu")),"../package.json"),"utf8"));
// Keep inference independent of Vinext's window-only dev helpers. The pinned
// ONNX binary is fetched from its official npm CDN rather than copied into the
// Site (it exceeds the per-asset hosting limit).
export async function buildLocalBackground(){
 const previousNodeEnv=process.env.NODE_ENV;
 try{await build({configFile:false,publicDir:false,logLevel:"warn",plugins:[{name:"local-ai-runtime-url",transform(code,id){
  if(!id.includes("onnxruntime-web")&&!id.includes("transformers"))return;
  return code.replace(/new URL\(\s*["'](ort-wasm[^"']+\.wasm)["']\s*,\s*import\.meta\.url\s*\)/g,(_all,name)=>`new URL(${JSON.stringify(`https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.version}/dist/${name}`)})`);
 }}],build:{outDir:fileURLToPath(new URL("../public/local-ai",import.meta.url)),emptyOutDir:true,target:"es2022",assetsInlineLimit:0,chunkSizeWarningLimit:1500,rollupOptions:{input:fileURLToPath(new URL("../lib/local-background.worker.ts",import.meta.url)),output:{format:"es",entryFileNames:"background.worker.js",codeSplitting:false}}}});
 }finally{if(previousNodeEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previousNodeEnv;}
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildLocalBackground();
