import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {buildFirebaseHosting, getPublicRelease} from "../scripts/firebase-hosting.mjs";

test("nie publikuj przy niejednoznacznej konfiguracji sprzedaży", () => {
  for (const env of [
    {VP_PUBLIC_RELEASE:"literówka"}, {VP_PUBLIC_RELEASE:"live"},
    {VP_PUBLIC_APP_ORIGIN:"https://panel.example.org"},
    ...["http://panel.example.org", "https://x.chatgpt.site", "https://panel.example.org/abonament",
       "https://panel.example.org/?s=x","https://login@panel.example.org"].map(VP_PUBLIC_APP_ORIGIN => ({VP_PUBLIC_RELEASE:"test", VP_PUBLIC_APP_ORIGIN}))
  ]) assert.throws(() => getPublicRelease(env));
});

test("gotowy HTML, pliki i linki do zakupu odpowiadają trybowi publikacji", async () => {
  const out=await mkdtemp(join(tmpdir(),"vp-hosting-test-"));
  const origin="https://panel.example.org"; // illustrative only; no network requests
  try {
    for (const mode of ["preview","test","live"]) {
      await buildFirebaseHosting(mode==="preview"?{}:{VP_PUBLIC_RELEASE:mode,VP_PUBLIC_APP_ORIGIN:origin},out);
      const page=await readFile(join(out,"index.html"),"utf8");
      assert.ok(page.includes('data-release="'+mode+'"'));
      assert.match(page,/29,90/);
      assert.match(page,/Pozyskiwanie towaru/);
      assert.match(page,/Materiały w przygotowaniu/);
      assert.doesNotMatch(page,/<!--vp-content-->|__VP_ORIGIN__|__VP_RELEASE__/);
      const hrefs=[...page.matchAll(/<a\b[^>]*?\bhref="([^"]+)"/g)].map(match=>match[1]);
      assert.ok(hrefs.length>10);
      for (const href of hrefs.filter(h=>h.startsWith("#"))) assert.ok(page.includes('id="'+href.slice(1)+'"'),href);
      const outward=hrefs.filter(h=>h!=="/"&&!h.startsWith("#"));
      if (mode==="preview") {
        assert.deepEqual(outward,[]);
        assert.match(page,/nie przyjmujemy jeszcze płatności/);
        assert.doesNotMatch(page,/Kup dostęp do panelu/);
      } else {
        assert.deepEqual(new Set(outward),new Set([origin+"/panel", origin+"/abonament"]));
        assert.equal(page.includes("Nie używaj prawdziwej karty"),mode==="test");
        assert.equal(page.includes("noindex,nofollow"),mode==="test");
      }
      for (const [,attribute,background] of page.matchAll(/(?:src|href)="(\/(?!\/)[^"]+)"|url\('(\/[^']+)'\)/g)) {
        const asset=attribute||background;
        assert.ok((await stat(join(out,asset))).isFile(),asset);
      }
      for (const name of ["light-oak","concrete","ecru-rug","natural-linen"]) {
        for (const suffix of [".webp","-thumb.webp"]) await stat(join(out,"backgrounds",name+suffix));
      }
      await assert.rejects(stat(join(out,"api")));
      await assert.rejects(stat(join(out,"server")));
    }
  } finally { await rm(out,{recursive:true,force:true}); }
});
