import {spawnSync} from "node:child_process";
import {readFileSync,existsSync,rmSync} from "node:fs";
const command=process.argv[2];
const run=args=>{const r=spawnSync(process.execPath,args,{stdio:"inherit"});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);};
if(command==="build"){
 await (await import("./build-local-background.mjs")).buildLocalBackground();
 const {createBuilder}=await import("vite");
 await (await createBuilder({configFile:"vite.standalone.config.ts"})).buildApp();
 rmSync("dist/server/.dev.vars",{force:true});
}else if(command==="dev"){
 run(["node_modules/vite/bin/vite.js","--config","vite.standalone.config.ts","--host","127.0.0.1"]);
}else if(command==="check-deploy"){
 const input=readFileSync("wrangler.standalone.jsonc","utf8");
 const config=JSON.parse(input),id=config.d1_databases?.find(d=>d.binding==="DB")?.database_id;
 if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id??"")||id==="00000000-0000-4000-8000-000000000000")throw Error("Uzupełnij prawdziwy database_id ze swojego konta Cloudflare.");
 if(config.vars?.VP_AUTH_MODE!=="standalone")throw Error("Wymagany tryb standalone.");
 if(!existsSync("dist/server/wrangler.json"))throw Error("Najpierw wykonaj build wersji standalone.");
 const built=JSON.parse(readFileSync("dist/server/wrangler.json","utf8"));
 if(built.vars?.VP_AUTH_MODE!=="standalone"||built.name!==config.name)throw Error("Ostatni build nie jest samodzielną wersją vintedplug. Wykonaj standalone:build.");
 console.log("Konfiguracja wiązań jest gotowa. Przed wdrożeniem skonfiguruj sekrety, pocztę i migrację danych według docs/standalone.md.");
}else throw Error("Użyj dev, build albo check-deploy.");
