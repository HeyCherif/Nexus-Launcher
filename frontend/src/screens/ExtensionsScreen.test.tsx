// @vitest-environment jsdom
import '../i18n';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ExtensionsScreen } from './ExtensionsScreen';
afterEach(()=>{cleanup();delete window.nexusDesktop;});
it('filters plugins without triggering installations and exposes real notification activation',async()=>{
 const activate=vi.fn().mockResolvedValue({installed:true,enabled:true,supported:true,state:'ready',progress:0});
 window.nexusDesktop={getCaptureEngineStatus:async()=>({installed:false,available:true,supported:true,state:'idle'}),getSavesStatus:async()=>({installed:false,available:true,supported:true,state:'idle'}),getSteamNotificationStatus:async()=>({installed:false,enabled:false,supported:true,state:'idle',progress:0}),activateSteamNotifications:activate} as unknown as NonNullable<Window['nexusDesktop']>;
 const view=render(<MemoryRouter><ExtensionsScreen/></MemoryRouter>);
 fireEvent.click(view.getByRole('button',{name:'Succès'}));
 const replay=view.getByRole('heading',{name:'Nexus Replay',hidden:true}).closest('[data-extension]')!;
 expect(replay.hasAttribute('hidden')).toBe(true);expect(activate).not.toHaveBeenCalled();
 fireEvent.click(view.getByRole('button',{name:'Activer'}));
 await waitFor(()=>expect(view.getByRole('button',{name:'Désactiver'})).toBeTruthy());
 expect(activate).toHaveBeenCalledTimes(1);
});
it('empty search offers reset and preview never claims plugins installed',()=>{
 const view=render(<MemoryRouter><ExtensionsScreen/></MemoryRouter>);
 fireEvent.change(view.getByRole('searchbox'),{target:{value:'nonexistent'}});
 expect(view.getByRole('status').textContent).toMatch(/Aucune extension/);
 fireEvent.click(view.getByRole('button',{name:'Tout afficher'}));
 expect(view.getByRole('heading',{name:'Nexus Replay'})).toBeTruthy();
 expect(view.getByText(/installation intégrée dans Nexus pour Windows/)).toBeTruthy();
});
