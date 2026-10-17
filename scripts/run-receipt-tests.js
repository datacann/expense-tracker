const path = require('path');
const fs = require('fs');
const ts = require('typescript');

function runTestFile(fileRel) {
  const abs = path.resolve(fileRel);
  const src = fs.readFileSync(abs, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { 
      module: ts.ModuleKind.CommonJS, 
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    }
  }).outputText;
  const m = { exports: {} };
  
  // Basit bir "mock" require sistemi: node_modules'den gelen hataları engellemek için
  const customRequire = (reqPath) => {
    if (reqPath.startsWith('.')) {
      const target = path.resolve(path.dirname(abs), reqPath + (reqPath.endsWith('.ts') ? '' : '.ts'));
      if (fs.existsSync(target)) return runTestFile(target);
      return require(reqPath);
    }
    // node_modules içindeki modülleri doğrudan require et
    return require(reqPath);
  };

  const fn = new Function('require', 'module', 'exports', '__dirname', '__filename', js);
  fn(customRequire, m, m.exports, path.dirname(abs), abs);
  return m.exports;
}

const testFiles = [
  'src/services/parseReceiptAnalysisResponse.test.ts',
  'src/utils/receiptValidation.test.ts',
  'src/utils/receiptFileOwnership.test.ts',
  'src/services/receiptSaveFlow.test.ts',
  'src/services/expenseEditFlow.test.ts',
  'src/services/receiptFlowIntegration.test.ts'
];

let hasFailure = false;

for (const file of testFiles) {
  try {
    console.log(`\n▶ Çalıştırılıyor: ${file}`);
    runTestFile(file);
    console.log(`✔ Geçti: ${file}`);
  } catch (err) {
    hasFailure = true;
    console.error(`✖ BAŞARISIZ: ${file}`);
    console.error(err);
  }
}

if (hasFailure) {
  console.error('\nBazı fiş testleri başarısız oldu!');
  process.exit(1);
} else {
  console.log('\n======================================');
  console.log('Tüm fiş testleri başarıyla tamamlandı.');
  console.log('======================================\n');
  process.exit(0);
}
