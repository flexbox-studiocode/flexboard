import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { readHiddenInput } from '../../scripts/password-input.mjs';

class FakeInput extends EventEmitter {
  isTTY = true;
  isRaw = false;
  setRawMode(value) { this.isRaw = value; }
  resume() {}
}

function run(chunks) {
  const input = new FakeInput();
  const output = { isTTY: true, writes: [], write(value) { this.writes.push(value); } };
  const promise = readHiddenInput({ input, output });
  for (const chunk of chunks) input.emit('data', chunk);
  return promise.then(value => ({ value, input, output }));
}

test('reads typed and pasted password without echoing it', async () => {
  const { value, output } = await run(['Abc', '!23#x', '\n']);
  assert.equal(value, 'Abc!23#x');
  assert.deepEqual(output.writes, ['Password: ']);
});

test('backspace removes one Unicode code point', async () => {
  const { value } = await run(['a😀b', '\x7f', 'c\n']);
  assert.equal(value, 'a😀c');
});

test('repeated backspace can empty the buffer', async () => {
  const { value } = await run(['abc', '\x7f\x7f\x7f', '\n']);
  assert.equal(value, '');
});

test('empty enter and cancellation restore raw mode', async () => {
  const empty = await run(['\n']);
  assert.equal(empty.value, '');
  await assert.rejects(run(['\x03']), /Ctrl\+C/);
});

test('rejects non-TTY input', async () => {
  const input = new FakeInput();
  input.isTTY = false;
  await assert.rejects(readHiddenInput({ input, output: { isTTY: true, write() {} } }), /terminal interaktif/);
});

test('terminal errors reject and restore raw mode', async () => {
  const input = new FakeInput();
  const output = { isTTY: true, write() {} };
  const promise = readHiddenInput({ input, output });
  input.emit('error', new Error('terminal failure'));
  await assert.rejects(promise, /terminal failure/);
  assert.equal(input.isRaw, false);
});
