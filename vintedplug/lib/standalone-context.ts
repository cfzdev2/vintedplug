import {AsyncLocalStorage} from "node:async_hooks";
const storage=new AsyncLocalStorage<ExecutionContext>();
export function withStandaloneContext<T>(context:ExecutionContext,run:()=>T){return storage.run(context,run);}
export function queueStandaloneTask(task:()=>Promise<unknown>){
 const context=storage.getStore();
 if(!context)throw new Error("Standalone request context unavailable");
 context.waitUntil(task().catch(()=>{console.error("vintedplug auth email delivery failed");}));
}
