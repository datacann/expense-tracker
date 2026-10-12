const fs = require('fs'); const path = require('path'); const ts = require('typescript');
const cache = new Map();
function load(file) { const abs=path.resolve(file); if(cache.has(abs)) return cache.get(abs).exports; const m={exports:{}}; cache.set(abs,m); const js=ts.transpileModule(fs.readFileSync(abs,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText; new Function('require','module','exports',js)((name)=>name.startsWith('.')?load(path.resolve(path.dirname(abs),name+(path.extname(name)?'':'.ts'))):require(name),m,m.exports); return m.exports; }
load('src/subscriptions/subscriptionAccess.test.ts'); console.log('✔ Premium entitlement erişim testleri geçti');
