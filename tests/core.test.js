import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {elapsed,validateConfig,validEndpoint,safeMediaUrl} from '../core.js';
const config=JSON.parse(fs.readFileSync(new URL('../config.json',import.meta.url)));
test('counter uses the Brazil offset, including before the first day',()=>{
  const start='2026-08-25T00:00:00-03:00';assert.deepEqual(elapsed(start,Date.parse('2026-10-01T15:55:12-03:00')),{days:37,hours:15,minutes:55,seconds:12});
  assert.deepEqual(elapsed(start,Date.parse('2026-08-24T23:00:00-03:00')),{days:0,hours:0,minutes:0,seconds:0});
});
test('configuration accepts the native playlist and proposal audio',()=>{assert.equal(validateConfig(config),config);assert.equal(config.playlists.length,5);assert.ok(config.playlists.every(s=>s.type==='audio'&&s.parts.length));assert.equal(config.proposalSong.type,'audio');assert.ok(config.proposalSong.parts.length);assert.equal(config.proposalSong.startAt,70);assert.equal(config.acceptSong.startAt,170);assert.equal(config.acceptSong.type,'audio');});
test('configuration rejects executable media and unsafe intro portraits',()=>{
  assert.equal(safeMediaUrl('javascript:alert(1)'),false);assert.equal(safeMediaUrl('//evil.test/photo'),false);
  assert.equal(validEndpoint('https://script.google.com.evil.test/macros/s/id/exec'),false);
  assert.throws(()=>validateConfig({...config,intro:{him:'javascript:alert(1)'}}));
  assert.throws(()=>validateConfig({...config,photos:[{url:'javascript:alert(1)',feeling:'x'}]}));
});
