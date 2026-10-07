// @vitest-environment jsdom
import '../i18n';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {test,expect,vi,afterEach} from 'vitest';
import {StartupSequence} from './StartupSequence';
import {useNexusStore} from '../state/useNexusStore';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
test('startup focuses skip and completes only once when skipped then ended',()=>{
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 useNexusStore.setState({locale:'fr'});const complete=vi.fn();const view=render(<StartupSequence onComplete={complete}/>);
 const skip=screen.getByRole('button',{name:/Passer/i});expect(document.activeElement).toBe(skip);
 fireEvent.click(skip);fireEvent.ended(view.container.querySelector('video')!);expect(complete).toHaveBeenCalledOnce();
});
test('replaying the film restores the launching control on unmount',()=>{
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const origin=document.createElement('button');document.body.append(origin);origin.focus();const view=render(<StartupSequence onComplete={()=>{}}/>);view.unmount();expect(document.activeElement).toBe(origin);origin.remove();
});
