/**
 * The Web Worker that runs a reader's code, as source text.
 *
 * It is a string rather than a module because it is loaded from a `Blob` URL:
 * the page's Content Security Policy allows `worker-src blob:` precisely so
 * that user code can be executed *somewhere that is not the page*. A worker
 * has no DOM, no access to the app's state or storage, and can be killed with
 * `terminate()` the moment it overruns — none of which is true of `eval` or a
 * script tag.
 *
 * What the harness adds around the user's code:
 *
 * - **`console` that reports back.** Every call becomes a `{ type: 'line' }`
 *   message, formatted the way DevTools would print it (objects expanded,
 *   `Map`/`Set` sized, errors with their stack).
 * - **Timer tracking.** The run is not over when the last synchronous line
 *   executes; it is over when the last `setTimeout` has fired. The wrappers
 *   count pending timers and post `{ type: 'idle' }` when the count hits zero
 *   after the main body has finished. An interval never settles, so the page's
 *   timeout is what ends those runs.
 * - **Error capture.** Synchronous throws, rejected promises and unhandled
 *   errors all arrive as `{ type: 'error' }` rather than as silence.
 *
 * The user's code is placed inside an `async` function so `await` works at the
 * top level, and receives `console` and the timer functions as *parameters*.
 * Shadowing by parameter is the one override that cannot be undone or missed:
 * a global property could be non-writable, but a parameter is just a name.
 */
export const HARNESS = `'use strict';
var __post = function (m) { self.postMessage(m); };
var __seen = new WeakSet();
function __fmt(v, depth) {
  if (typeof v === 'string') return depth ? JSON.stringify(v) : v;
  if (v === null || v === undefined) return String(v);
  var t = typeof v;
  if (t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol') return String(v);
  if (t === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
  if (v instanceof Error) return v.stack || v.name + ': ' + v.message;
  if (v instanceof Date) return v.toISOString();
  if (v instanceof Promise) return 'Promise { <pending> }';
  if (v instanceof Map) return 'Map(' + v.size + ') {' + Array.from(v, function (e) { return __fmt(e[0], depth + 1) + ' => ' + __fmt(e[1], depth + 1); }).join(', ') + '}';
  if (v instanceof Set) return 'Set(' + v.size + ') {' + Array.from(v, function (x) { return __fmt(x, depth + 1); }).join(', ') + '}';
  if (depth > 3) return Array.isArray(v) ? '[Array]' : '[Object]';
  if (__seen.has(v)) return '[Circular]';
  __seen.add(v);
  try {
    if (Array.isArray(v)) return '[' + v.map(function (x) { return __fmt(x, depth + 1); }).join(', ') + ']';
    var keys = Object.keys(v);
    var ctor = v.constructor && v.constructor.name;
    var name = ctor && ctor !== 'Object' ? ctor + ' ' : '';
    if (!keys.length) return name + '{}';
    return name + '{ ' + keys.map(function (k) { return k + ': ' + __fmt(v[k], depth + 1); }).join(', ') + ' }';
  } finally {
    __seen.delete(v);
  }
}
var __line = function (level) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    __post({ type: 'line', level: level, text: args.map(function (a) { return __fmt(a, 0); }).join(' ') });
  };
};
var __noop = function () {};
var __console = {
  log: __line('log'), info: __line('info'), debug: __line('log'), warn: __line('warn'), error: __line('error'),
  table: __line('log'), dir: __line('log'), trace: __line('log'), group: __line('log'), groupCollapsed: __line('log'),
  groupEnd: __noop, time: __noop, timeEnd: __noop, timeLog: __noop, count: __noop, clear: __noop,
  assert: function (ok) { if (!ok) __line('error').apply(null, ['Assertion failed:'].concat(Array.prototype.slice.call(arguments, 1))); }
};
var __timers = new Set();
var __done = false;
var __check = function () { if (__done && __timers.size === 0) __post({ type: 'idle' }); };
var __setTimeout = function (fn, ms) {
  var rest = Array.prototype.slice.call(arguments, 2);
  var id = setTimeout(function () {
    __timers.delete(id);
    try { if (typeof fn === 'function') fn.apply(null, rest); } finally { __check(); }
  }, ms);
  __timers.add(id);
  return id;
};
var __setInterval = function (fn, ms) {
  var rest = Array.prototype.slice.call(arguments, 2);
  var id = setInterval(function () { if (typeof fn === 'function') fn.apply(null, rest); }, ms);
  __timers.add(id);
  return id;
};
var __clearTimeout = function (id) { __timers.delete(id); clearTimeout(id); __check(); };
var __clearInterval = function (id) { __timers.delete(id); clearInterval(id); __check(); };
var __fail = function (e) { __post({ type: 'error', text: (e && e.stack) || String(e) }); };
self.addEventListener('error', function (e) { __fail(e.error || e.message); e.preventDefault(); });
self.addEventListener('unhandledrejection', function (e) { __fail(e.reason); e.preventDefault(); });
(async function (console, setTimeout, setInterval, clearTimeout, clearInterval) {
/*__USER_CODE__*/
})(__console, __setTimeout, __setInterval, __clearTimeout, __clearInterval).then(
  function () { __done = true; __check(); },
  function (e) { __fail(e); __done = true; __check(); }
);
`;

/** Where the user's code starts inside the worker source, for turning stack-trace line numbers back into theirs. */
export const HARNESS_PREFIX_LINES =
  HARNESS.slice(0, HARNESS.indexOf('/*__USER_CODE__*/')).split('\n').length - 1;
