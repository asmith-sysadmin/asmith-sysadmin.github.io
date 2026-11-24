const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const script = read('assets/portfolio.js');
const formMarkup = read('contact.html').match(/<form\b[^>]*data-portfolio-contact[^>]*>/)[0];
const action = new URL(formMarkup.match(/action="([^"]+)"/)[1]);
assert.equal(action.origin, 'https://formspree.io');
assert.match(action.pathname, /^\/f\/(?:FORM_ID|[a-z0-9]+)$/);
const unconfigured = new URL('/f/FORM_ID', action).href;
const endpoint = new URL('/f/testform', action).href;
const fields = {
 name: 'Example Visitor',
 email: 'visitor@example.test',
 subject: 'Portfolio contact test',
 message: 'Test content retained when sending fails.',
 _gotcha: '',
};

function loadForm(fetch, { action = endpoint, valid = true } = {}) {
 const status = { textContent: 'Online sending is unavailable.' };
 const button = { disabled: true };
 const values = { ...fields };
 let handler;
 let resets = 0;
 const form = {
  action,
  addEventListener(type, listener) {
   assert.equal(type, 'submit');
   handler = listener;
  },
  querySelector() { return button; },
  reportValidity() { return valid; },
  reset() {
   resets += 1;
   for (const key of Object.keys(values)) values[key] = '';
  },
 };
 vm.runInNewContext(script, {
  document: {
   querySelector(selector) { return selector === 'form[data-portfolio-contact]' ? form : null; },
   getElementById(id) { return id === 'contact-status' ? status : null; },
  },
  fetch,
  AbortSignal,
  FormData: class extends URLSearchParams {
   constructor(source) {
    assert.equal(source, form);
    super(values);
   }
  },
 });
 return {
  button,
  status,
  values,
  get resets() { return resets; },
  submit() {
   let prevented = false;
   const pending = handler({ preventDefault() { prevented = true; } });
   assert.equal(prevented, true);
   return pending;
  },
 };
}

test('posts all form fields once and clears them only after acceptance', async () => {
 let accept;
 let requests = 0;
 const page = loadForm((url, request) => {
  requests += 1;
  assert.equal(url, endpoint);
  assert.equal(request.method, 'POST');
  assert.equal(request.headers.Accept, 'application/json');
  assert.deepEqual(Object.fromEntries(request.body), fields);
  return new Promise(resolve => { accept = resolve; });
 });
 assert.equal(page.button.disabled, false);
 const first = page.submit();
 assert.equal(page.button.disabled, true);
 assert.match(page.status.textContent, /Sending/);
 await page.submit();
 assert.equal(requests, 1);
 assert.deepEqual(page.values, fields);
 accept(Response.json({ next: '/thanks' }));
 await first;
 assert.match(page.status.textContent, /Your message was submitted/);
 assert.equal(page.resets, 1);
 assert.equal(page.values.message, '');
 assert.equal(page.button.disabled, false);
});

test('blocks an unconfigured or invalid form before making a request', async () => {
 const unexpectedFetch = () => assert.fail('A request should not have been made');
 const missingId = loadForm(unexpectedFetch, { action: unconfigured });
 assert.equal(missingId.button.disabled, true);
 await missingId.submit();
 assert.match(missingId.status.textContent, /unavailable/);

 const invalid = loadForm(unexpectedFetch, { valid: false });
 await invalid.submit();
 assert.equal(invalid.resets, 0);
 assert.equal(invalid.button.disabled, false);
 assert.equal(invalid.status.textContent, '');
});

const failures = [
 ['provider rejection', () => new Response('Internal error', { status: 500 }), /could not accept/],
 ['rate limit', () => new Response('', { status: 429 }), /try again later/],
 ['unexpected JSON', () => Response.json({}), /could not confirm/],
 ['unexpected HTML', () => new Response('<html>Proxy error</html>'), /could not confirm/],
 ['network interruption', () => Promise.reject(new TypeError('offline')), /could not confirm/],
 ['timeout', () => Promise.reject(new DOMException('Timed out', 'TimeoutError')), /could not confirm/],
];

for (const [label, fetch, expectedStatus] of failures) {
 test(`${label} preserves the draft and lets the visitor retry`, async () => {
  const page = loadForm(fetch);
  await page.submit();
  assert.match(page.status.textContent, expectedStatus);
  assert.match(page.status.textContent, /email link/);
  assert.deepEqual(page.values, fields);
  assert.equal(page.resets, 0);
  assert.equal(page.button.disabled, false);
 });
}
