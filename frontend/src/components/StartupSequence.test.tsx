// @vitest-environment jsdom
import '../i18n';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {test,expect,vi,afterEach,beforeEach} from 'vitest';
import {StartupSequence} from './StartupSequence';
import {useNexusStore} from '../state/useNexusStore';
import type {Game} from '../types';

const game=(id:string,artwork:string,heroArtwork?:string)=>({id,title:id,artwork,heroArtwork} as Game);

beforeEach(()=>{
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 useNexusStore.setState({locale:'fr',selectedGameId:'aurora',libraryScanState:'ready',discoveredGames:[
  game('ember','/ember.jpg'),
  game('aurora','/aurora-cover.jpg','/aurora-hero.jpg'),
  game('echo','/echo.jpg'),
 ]});
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});

test('startup awakening presents the selected world through one Nexus portal',()=>{
 const view=render(<StartupSequence onComplete={()=>{}}/>);
 expect(view.container.querySelector('video')).toBeNull();
 const portal=view.container.querySelector<HTMLElement>('[data-signature="nexus-portal"]');
 expect(portal).not.toBeNull();
 expect(portal?.getAttribute('data-portal-game-id')).toBe('aurora');
 expect(portal?.querySelectorAll('[data-nexus-stroke]')).toHaveLength(3);
 expect(view.container.querySelector('[data-startup-fragment]')).toBeNull();
});

test('startup focuses skip and completes only once when skipped then sequence expires',()=>{
 vi.useFakeTimers();const complete=vi.fn();render(<StartupSequence onComplete={complete}/>);
 const skip=screen.getByRole('button',{name:/Passer/i});expect(document.activeElement).toBe(skip);
 fireEvent.click(skip);vi.advanceTimersByTime(10_000);expect(complete).toHaveBeenCalledOnce();
});
test('startup waits for the initial scan and freezes the ready library snapshot',()=>{
 vi.useFakeTimers();
 useNexusStore.setState({libraryScanState:'scanning',selectedGameId:'',discoveredGames:[]});
 const complete=vi.fn();const view=render(<StartupSequence onComplete={complete}/>);
 act(()=>vi.advanceTimersByTime(10_000));
 expect(complete).not.toHaveBeenCalled();
 act(()=>useNexusStore.setState({libraryScanState:'ready',selectedGameId:'aurora',discoveredGames:[game('aurora','/aurora.jpg'),game('echo','/echo.jpg')]}));
 expect(view.container.querySelector('[data-signature="nexus-portal"]')?.getAttribute('data-portal-game-id')).toBe('aurora');
 act(()=>useNexusStore.setState({discoveredGames:[game('changed','/changed.jpg')]}));
 expect(view.container.querySelector('[data-signature="nexus-portal"]')?.getAttribute('data-portal-game-id')).toBe('aurora');
 act(()=>vi.advanceTimersByTime(5_600));
 expect(complete).toHaveBeenCalledOnce();
});
test('replaying the awakening restores the launching control on unmount',()=>{
 const origin=document.createElement('button');document.body.append(origin);origin.focus();const view=render(<StartupSequence onComplete={()=>{}}/>);view.unmount();expect(document.activeElement).toBe(origin);origin.remove();
});
