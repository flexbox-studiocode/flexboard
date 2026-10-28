import { stdin as defaultInput, stdout as defaultOutput } from 'node:process';

export function readHiddenInput({ input = defaultInput, output = defaultOutput, prompt = 'Password: ' } = {}) {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
    return Promise.reject(new Error('Password input membutuhkan terminal interaktif.'));
  }

  return new Promise((resolve, reject) => {
    let value = '';
    let settled = false;
    const wasRaw = Boolean(input.isRaw);

    const cleanup = () => {
      input.off('data', onData);
      input.off('error', onError);
      input.off('end', onEnd);
      if (input.isRaw !== wasRaw) input.setRawMode(wasRaw);
    };
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(result);
    };
    const onError = error => finish(error);
    const onEnd = () => finish(new Error('Input password dibatalkan karena terminal ditutup.'));
    const onData = chunk => {
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      let index = 0;
      while (index < text.length && !settled) {
        const codePoint = text.codePointAt(index);
        const character = String.fromCodePoint(codePoint);
        index += character.length;
        if (character === '\u0003') {
          finish(new Error('Input password dibatalkan oleh Ctrl+C.'));
        } else if (character === '\r' || character === '\n') {
          finish(null, value);
        } else if (character === '\u007f' || character === '\b') {
          value = Array.from(value).slice(0, -1).join('');
        } else if (codePoint >= 0x20) {
          value += character;
        }
      }
    };

    try {
      output.write(prompt);
      input.setRawMode(true);
      input.resume();
      input.on('data', onData);
      input.once('error', onError);
      input.once('end', onEnd);
    } catch (error) {
      finish(error);
    }
  });
}
