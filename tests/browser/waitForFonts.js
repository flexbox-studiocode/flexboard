// Waits for webfonts so layout assertions measure the real font metrics, but never blocks forever.
//
// `document.fonts.ready` only settles once every pending font face finishes — including the third-party
// Google Fonts faces imported by `src/styles/tokens.css`. Offline, throttled, or CI runs without network
// access can therefore leave it pending past the test timeout, failing a test that is really about layout.
// Every font stack in tokens.css ends in a system fallback, so after a bounded wait the layout is still
// deterministic; we simply stop waiting for the network.
export const FONT_WAIT_MS = 3000

export async function waitForFonts(page, timeout = FONT_WAIT_MS) {
  await page.evaluate(async limit => {
    if (!('fonts' in document)) return
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, limit))])
  }, timeout)
}

export default waitForFonts
