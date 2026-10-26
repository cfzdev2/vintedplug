import {existsSync,readFileSync,writeFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {readExecutionProfile} from "./execution-profile.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
process.chdir(root);
const [major,minor]=process.versions.node.split(".").map(Number);
if(major<22||(major===22&&minor<13)){
 console.error("Zainstaluj Node.js 24 LTS (projekt wymaga co najmniej 22.13).");
 process.exit(1);
}
const cli=path.join(root,"node_modules/wrangler/bin/wrangler.js");
if(!existsSync(cli)){
 console.error("Najpierw uruchom 01-instalacja.cmd albo zainstaluj zależności z pnpm-lock.yaml.");
 process.exit(1);
}
const variables=path.join(root,".dev.vars");
if(!existsSync(variables)){
 writeFileSync(variables,readFileSync(path.join(root,".dev.vars.example")),{flag:"wx"});
 console.log("Utworzono lokalne ustawienia .dev.vars.");
}
// Portable development authenticates only on loopback as local_vintedplug.
// This edits ignored local configuration; hosted access uses its own stable ID.
if(readExecutionProfile()==="portable"){
 const local=readFileSync(variables,"utf8");
 if(!/^VP_BILLING_OWNER_ID\s*=\s*["']?[^\s"'\r\n]+/m.test(local)){
  writeFileSync(variables,local.replace(/^VP_BILLING_OWNER_ID\s*=.*$/gm,"").trimEnd()+"\nVP_BILLING_OWNER_ID=local_vintedplug\n");
 }
}
console.log("Przygotowanie bazy danych na tym komputerze...");
const result=spawnSync(process.execPath,["--import","./scripts/sites-env.mjs",cli,
 "d1","migrations","apply","DB","--local","--config","wrangler.local.json",
 "--persist-to",".wrangler/state"],{
 cwd:root,stdio:["ignore","inherit","inherit"],env:{...process.env,CI:"true"},
});
if(result.error){console.error(result.error.message);process.exit(1);}
if(result.status!==0)process.exit(result.status??1);
console.log("\nGotowe. Uruchom 02-uruchom.cmd albo npm run dev.");
console.log("Panel lokalny: http://127.0.0.1:5173");
