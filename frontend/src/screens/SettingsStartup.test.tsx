// @vitest-environment jsdom
import '../i18n';
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {SettingsScreen} from './SettingsScreen';
import {useNexusStore} from '../state/useNexusStore';
vi.mock('../services/libraryClient',()=>({libraryClient:{steamGridStatus:async()=>({configured:false}),getSteamGridStatus:async()=>({configured:false})}}));
afterEach(()=>{cleanup();localStorage.clear();});
test('intro replay and setup replay are separate actions',()=>{
 useNexusStore.setState({locale:'fr'});const intro=vi.fn(),setup=vi.fn();render(<MemoryRouter><SettingsScreen onReplayStartup={intro} onReplayOnboarding={setup}/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Rejouer l’introduction Nexus'}));expect(intro).toHaveBeenCalledOnce();expect(setup).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Reconfigurer Nexus'}));expect(setup).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('switch',{name:'Introduction au démarrage'}));expect(localStorage.getItem('nexus.startup.enabled.v1')).toBe('false');
});
test('a failed preference save does not silently change the switch',()=>{
 useNexusStore.setState({locale:'fr'});render(<MemoryRouter><SettingsScreen onReplayStartup={()=>{}} onReplayOnboarding={()=>{}}/></MemoryRouter>);
 const save=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});const toggle=screen.getByRole('switch',{name:'Introduction au démarrage'});
 fireEvent.click(toggle);expect(toggle.getAttribute('aria-checked')).toBe('true');expect(screen.getByRole('status').textContent).toContain('Impossible');save.mockRestore();
});
