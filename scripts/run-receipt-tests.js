const path = require('path');
const fs = require('fs');
const ts = require('typescript');

function runTestFile(fileRel) {
  const abs = path.resolve(fileRel);
  const src = fs.readFileSync(abs, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const m = { exports: {} };
  const fn = new Function('require', 'module', 'exports', '__dirname', '__filename', js);
  fn((reqPath) => {
    if (reqPath.startsWith('.')) {
      const target = path.resolve(path.dirname(abs), reqPath + (reqPath.endsWith('.ts') ? '' : '.ts'));
      return runTestFile(target);
    }
    return require(reqPath);
  }, m, m.exports, path.dirname(abs), abs);
  return m.exports;
}

const testFiles = [
  'src/services/parseReceiptAnalysisResponse.test.ts',
  'src/services/prepareReceiptUpload.test.ts',
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
