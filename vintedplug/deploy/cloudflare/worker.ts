import handler from "vinext/server/fetch-handler";
import {withStandaloneContext} from "../../lib/standalone-context";

export default {
 fetch(request:Request,env:Cloudflare.Env,context:ExecutionContext){
  if(env.VP_AUTH_MODE!=="standalone")return Response.json({error:"Samodzielna wersja czeka na konfigurację."},{status:503});
  const headers=new Headers(request.headers);
  for(const name of [...headers.keys()])if(name.toLowerCase().startsWith("oai-authenticated-")||name.toLowerCase()==="oai-sites-authorization")headers.delete(name);
  // This entrypoint has no Sites plugins, mock identity or connector bindings.
  return withStandaloneContext(context,()=>handler.fetch(new Request(request,{headers}),env,context));
 },
};
