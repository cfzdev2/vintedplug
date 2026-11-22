import {build} from "vite";
import {cp, mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const app = fileURLToPath(new URL("../", import.meta.url));
const source = join(app, "deploy/firebase");

// These are the only two settings passed to the public page. Secrets stay on the Worker.
export function getPublicRelease(env) {
  const availability = (env.VP_PUBLIC_RELEASE || "preview").trim();
  if (!["preview", "test", "live"].includes(availability)) throw Error("VP_PUBLIC_RELEASE: wybierz preview, test albo live.");
  const raw = (env.VP_PUBLIC_APP_ORIGIN || "").trim();
  if (availability === "preview") {
    if (raw) throw Error("W trybie preview usuń VP_PUBLIC_APP_ORIGIN. Przejście do panelu włącz jawnie w trybie test albo live.");
    return {independent:true, availability, appOrigin:""};
  }
  let url;
  try { url = new URL(raw); } catch { throw Error("Podaj pełny adres HTTPS samodzielnego panelu w VP_PUBLIC_APP_ORIGIN."); }
  if (url.protocol !== "https:" || url.username || url.password || url.href !== url.origin + "/" ||
      !url.hostname.includes(".") || /(^|\.)chatgpt\.site$/i.test(url.hostname)) {
    throw Error("Wymagany jest adres HTTPS samodzielnego panelu, bez ścieżki, danych logowania i parametrów.");
  }
  return {independent:true, availability, appOrigin:url.origin};
}

export async function buildFirebaseHosting(env=process.env, out=join(app,"dist-firebase")) {
  const props = getPublicRelease(env);
  const temp = await mkdtemp(join(app, ".firebase-render-"));
  const common = {root:source, configFile:false, publicDir:false, envDir:false, css:{postcss:{plugins:[]}}, logLevel:"warn"};
  try {
    await build({...common, build:{ssr:join(source,"prerender.tsx"), outDir:temp, emptyOutDir:false,
      rolldownOptions:{output:{entryFileNames:"render.mjs"}}}});
    const {render} = await import(pathToFileURL(join(temp,"render.mjs")).href);
    const html = render(props);
    await build({...common, build:{outDir:out, emptyOutDir:true}});
    const page = join(out, "index.html");
    const template = await readFile(page,"utf8");
    for (const marker of ["<!--vp-content-->","__VP_RELEASE__","__VP_ORIGIN__"]) {
      if (!template.includes(marker)) throw Error("Brakuje znacznika w szablonie strony: " + marker);
    }
    let doc = template.replace("__VP_RELEASE__",props.availability).replace("__VP_ORIGIN__",props.appOrigin)
      .replace("<!--vp-content-->", () => html);
    if (props.availability === "test") doc = doc.replace("</head>", '<meta name="robots" content="noindex,nofollow"></head>');
    await writeFile(page, doc);
    // Explicit allowlist: never upload panel code, photos of users, API routes or local configs.
    const assets = ["favicon.ico","apple-touch-icon.png","brand/vintedplug-logo-128.webp"];
    for (const material of ["light-oak","concrete","ecru-rug","natural-linen"]) {
      assets.push("backgrounds/"+material+".webp", "backgrounds/"+material+"-thumb.webp");
    }
    for (const asset of assets) {
      await mkdir(dirname(join(out,asset)), {recursive:true});
      await cp(join(app,"public",asset), join(out,asset));
    }
    console.log("Firebase Hosting: " + props.availability + " → dist-firebase" + (props.appOrigin ? " | panel: "+props.appOrigin : " | zapisy i płatności wyłączone"));
  } finally {
    await rm(temp,{recursive:true,force:true});
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildFirebaseHosting();
