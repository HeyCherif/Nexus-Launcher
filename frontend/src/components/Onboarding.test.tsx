// @vitest-environment jsdom
import '../i18n';
import { render, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Onboarding } from './Onboarding';
import { libraryClient } from '../services/libraryClient';
afterEach(()=>{cleanup();delete window.nexusDesktop;vi.restoreAllMocks();});
it('a late folder choice cannot validate a reopened setup',async()=>{
 let finish!:(value:{folder:string;count:number})=>void;
 const add=vi.fn(()=>new Promise<{folder:string;count:number}>(resolve=>{finish=resolve;})),complete=vi.fn();
 const view=render(<Onboarding open onComplete={complete} onAddFolder={add}/>);
 fireEvent.click(view.getByRole('button',{name:/Choisir mon dossier/i}));
 view.rerender(<Onboarding open={false} onComplete={complete} onAddFolder={add}/>);
 view.rerender(<Onboarding open onComplete={complete} onAddFolder={add}/>);
 await act(async()=>{finish({folder:'D:\\Old',count:2});});
 await waitFor(()=>expect(view.getByRole('button',{name:'Continuer'}).hasAttribute('disabled')).toBe(true));
 expect(view.queryByText('D:\\Old')).toBeNull();
});
it('inspects device and launchers automatically without connecting accounts',async()=>{
 const inspect=vi.fn().mockResolvedValue({hardware:{cpu:'Real CPU',memoryGB:16,gpus:['Real GPU'],os:'Windows',display:'1920 × 1080'},stores:{steam:'installed',epic:'absent',gog:'unknown'},checkedAt:'2026-10-07'}),connect=vi.fn();
 window.nexusDesktop={inspectSetup:inspect,connectSteamAccount:connect} as unknown as NonNullable<Window['nexusDesktop']>;
 const view=render(<Onboarding open onComplete={vi.fn()} onAddFolder={vi.fn()}/>);
 expect(await view.findByText('Real CPU')).toBeTruthy();expect(view.getByText('Real GPU')).toBeTruthy();expect(view.getByText('16 Go')).toBeTruthy();expect(view.getByText('Installé')).toBeTruthy();expect(connect).not.toHaveBeenCalled();
});
it('store choice runs a real scan; failed scan cannot mark setup ready',async()=>{
 const scan=vi.spyOn(libraryClient,'scan').mockRejectedValue(Error('Scan unavailable'));
 const view=render(<Onboarding open onComplete={vi.fn()} onAddFolder={vi.fn()}/>);
 fireEvent.click(view.getByRole('button',{name:'Utiliser mes jeux Steam et Epic'}));await waitFor(()=>expect(scan).toHaveBeenCalledWith(undefined,true));
 expect(await view.findByText('Scan unavailable')).toBeTruthy();expect(view.getByRole('button',{name:'Continuer'}).hasAttribute('disabled')).toBe(true);
});
it('hardware failure offers retry while folder setup remains usable',async()=>{
 const inspect=vi.fn().mockRejectedValueOnce(Error('unavailable')).mockResolvedValue({hardware:{cpu:'Recovered CPU',memoryGB:8,gpus:[],os:'Windows'},stores:{steam:'absent',epic:'absent',gog:'absent'}});
 window.nexusDesktop={inspectSetup:inspect} as unknown as NonNullable<Window['nexusDesktop']>;
 const view=render(<Onboarding open onComplete={vi.fn()} onAddFolder={vi.fn().mockResolvedValue({folder:'D:\\Games',count:2})}/>);
 fireEvent.click(await view.findByRole('button',{name:'Réessayer la détection'}));await view.findByText('Recovered CPU');
 fireEvent.click(view.getByRole('button',{name:/Choisir mon dossier/i}));await waitFor(()=>expect(view.getByRole('button',{name:'Continuer'}).hasAttribute('disabled')).toBe(false));
});
it('asks for the game folder first and cancellation does not complete the choice', async () => {
  const add = vi.fn().mockResolvedValue(null), complete = vi.fn();
  const view = render(<Onboarding open onComplete={complete} onAddFolder={add} />);
  expect(view.getByRole('button', { name: /Choisir mon dossier/i })).toBeTruthy();
  expect(view.getByRole('button', { name: 'Continuer' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(view.getByRole('button', { name: /Choisir mon dossier/i }));
  await waitFor(() => expect(add).toHaveBeenCalledTimes(1));
  expect(view.getByRole('button', { name: 'Continuer' }).hasAttribute('disabled')).toBe(true);
  expect(complete).not.toHaveBeenCalled();
});
