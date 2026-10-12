import { createSubmissionLock } from './submissionLock';

const run = async () => {
  const lock = createSubmissionLock();
  let addCalls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const save = () => lock.run(async () => { addCalls += 1; await gate; });

  const first = save();
  const second = await save();
  if (second.started) throw new Error('Hızlı ikinci manuel gönderim başlatıldı');
  release();
  await first;
  if (addCalls !== 1) throw new Error('Hızlı çift gönderim birden fazla kayıt oluşturdu');

  let failed = false;
  try { await lock.run(async () => { throw new Error('storage failed'); }); } catch { failed = true; }
  if (!failed) throw new Error('Yazma hatası aktarılmadı');
  const retry = await lock.run(async () => { addCalls += 1; });
  if (!retry.started || Number(addCalls) !== 2) throw new Error('Hata sonrası manuel yeniden deneme çalışmadı');
  console.log('Submission lock tests passed');
};

run().catch((error) => { console.error(error); process.exit(1); });
