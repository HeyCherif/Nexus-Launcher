// @vitest-environment jsdom
import {cleanup,render,fireEvent,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {ExtensionHubCard} from './ExtensionHubCard';
afterEach(()=>{cleanup();delete window.nexusDesktop;vi.unstubAllGlobals();});
it('free games load only after opening and link to the verified offer through desktop IPC',async()=>{
 const load=vi.fn().mockResolvedValue({source:'GamerPower',state:'ready',checkedAt:null,offers:[{id:7,title:'Actual offer',platforms:'Steam',url:'https://www.gamerpower.com/actual',expiresAt:null}]}),open=vi.fn().mockResolvedValue({ok:true});
 window.nexusDesktop={getFreeGames:load,openFreeGame:open} as unknown as NonNullable<Window['nexusDesktop']>;
 const view=render(<ExtensionHubCard kind="free-games"/>);expect(load).not.toHaveBeenCalled();fireEvent.click(view.getByRole('button',{name:'Découvrir les offres'}));
 expect(await view.findByText('Actual offer')).toBeTruthy();fireEvent.click(view.getByRole('button',{name:'Voir l’offre'}));await waitFor(()=>expect(open).toHaveBeenCalledWith(7));
});
it('unavailable activity does not show fake zero statistics',async()=>{
 window.nexusDesktop={getActivityOverview:async()=>({source:'Nexus',state:'unavailable',sessions:[]})} as unknown as NonNullable<Window['nexusDesktop']>;
 const view=render(<ExtensionHubCard kind="activity"/>);fireEvent.click(view.getByRole('button',{name:'Voir mon activité'}));await view.findByText('Impossible de charger. Réessayez.');expect(view.queryByText('0 h 0 min')).toBeNull();
});
