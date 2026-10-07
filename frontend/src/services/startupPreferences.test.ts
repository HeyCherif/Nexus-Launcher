// @vitest-environment jsdom
import {test,expect,afterEach} from 'vitest';
import {readStartupEnabled,writeStartupEnabled} from './startupPreferences';
afterEach(()=>localStorage.clear());
test('the approved intro is enabled by default and can be turned off for the next launch',()=>{
 expect(readStartupEnabled()).toBe(true);writeStartupEnabled(false);expect(readStartupEnabled()).toBe(false);writeStartupEnabled(true);expect(readStartupEnabled()).toBe(true);
});
test('unknown stored values keep the approved default',()=>{localStorage.setItem('nexus.startup.enabled.v1','invalid');expect(readStartupEnabled()).toBe(true);});
