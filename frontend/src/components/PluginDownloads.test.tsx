// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ReplayPluginCard } from './ReplayPluginCard';
afterEach(()=>{cleanup();delete window.nexusDesktop;vi.restoreAllMocks();vi.unstubAllGlobals();});
it('preview labels desktop installation without downloading archives',async()=>{
 const url='https://github.com/zamakz641-byte/Nexus-Launcher/releases/download/plugin-nexus-replay-v0.1.0/nexus-replay-0.1.0-win-x64.zip';
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify([{id:'nexus-replay',available:true,version:'0.1.0',downloadBytes:8942365,url}]))));
 const view=render(<ReplayPluginCard/>);
 expect(await view.findByText('Installation dans Nexus pour Windows')).toBeTruthy();
 expect(view.queryByRole('link',{name:/archive/})).toBeNull();
 expect(view.queryByRole('button',{name:'Bientôt disponible'})).toBeNull();
});
it('catalog errors can be retried immediately without auto installation',async()=>{
 const status=vi.fn().mockResolvedValueOnce({installed:false,available:false,supported:true,releaseError:'download-unavailable'}).mockResolvedValue({installed:false,available:true,supported:true});
 const install=vi.fn();window.nexusDesktop={getCaptureEngineStatus:status,activateCaptureEngine:install} as unknown as NonNullable<Window['nexusDesktop']>;
 const view=render(<ReplayPluginCard/>);fireEvent.click(await view.findByRole('button',{name:'Réessayer'}));
 expect(await view.findByRole('button',{name:'Installer'})).toBeTruthy();expect(status).toHaveBeenLastCalledWith(true);expect(install).not.toHaveBeenCalled();
});
