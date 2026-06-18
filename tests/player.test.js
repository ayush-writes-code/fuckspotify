import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextTrackIndex, parseLRC } from '../src/lib/player.js';

test('getNextTrackIndex advances through a playlist', () => {
  assert.equal(getNextTrackIndex(0, 3, 0), 1);
});

test('getNextTrackIndex stops at the end when repeat is off', () => {
  assert.equal(getNextTrackIndex(2, 3, 0), null);
});

test('getNextTrackIndex wraps when repeat is enabled', () => {
  assert.equal(getNextTrackIndex(2, 3, 1), 0);
});

test('parseLRC parses, duplicates, and orders timestamps', () => {
  assert.deepEqual(parseLRC('[00:10.50][00:12.500]Later\n[00:01:25]First'), [
    { time: 1.25, text: 'First' },
    { time: 10.5, text: 'Later' },
    { time: 12.5, text: 'Later' },
  ]);
});
