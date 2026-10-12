import { resolvePermissionAction } from './receiptPermission';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

assert(resolvePermissionAction('granted', true) === 'launch', 'Verilmiş izin doğrudan seçiciyi açmalı');
assert(resolvePermissionAction('denied', true) === 'request', 'Tekrar sorulabilen izin istenmeli');
assert(resolvePermissionAction('denied', false) === 'settings', 'Tekrar sorulamayan izin ayarlara yönlenmeli');
assert(resolvePermissionAction('undetermined', true) === 'request', 'Belirsiz izin istenmeli');

console.log('Receipt permission tests passed');
