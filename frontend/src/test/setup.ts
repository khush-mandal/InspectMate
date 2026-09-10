import 'fake-indexeddb/auto';

// Polyfill URL.createObjectURL and URL.revokeObjectURL for jsdom if needed
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = (blob: Blob) => `blob:http://localhost/${crypto.randomUUID()}`;
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => {};
}
