// @vitest-environment jsdom
import '../i18n';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, test, expect, vi } from 'vitest';
import { GameDetailScreen } from './GameDetailScreen';
import { useNexusStore } from '../state/useNexusStore';
import type { Game } from '../types';
const game:Game={id:'real',title:'My Game',description:{fr:'Description du jeu',en:'Game description'},genre:{fr:'Action',en:'Action'},metadata:[],artwork:'/cover.jpg',installed:true,source:'Steam',developer:'Studio',publisher:'Publisher',releaseDate:'2026',ageRating:'Non renseigné',playtimeHours:0,lastPlayed:{fr:'Date dossier',en:'Folder date'},version:'',installSize:'',achievementProgress:{unlocked:0,total:0},rating:0,trailer:{title:{fr:'Trailer',en:'Trailer'},duration:''},features:[],discovered:true,screenshots:['/one.jpg','/two.jpg']};
afterEach(()=>{cleanup();useNexusStore.setState({discoveredGames:[],locale:'fr'});});
function renderDetail(){useNexusStore.setState({discoveredGames:[game],locale:'fr',libraryScanState:'ready'});const launch=vi.fn();render(<MemoryRouter initialEntries={['/game/real']}><Routes><Route path="/game/:gameId" element={<GameDetailScreen onLaunch={launch}/>}/></Routes></MemoryRouter>);return launch;}
test('game hub preserves launch and accessible media tabs without invented stats',async()=>{
 const launch=renderDetail();fireEvent.click(screen.getByRole('button',{name:'Jouer'}));expect(launch).toHaveBeenCalledOnce();
 expect(screen.queryByText('Date dossier')).toBeNull();expect(screen.queryByText('/100')).toBeNull();
 const overview=screen.getByRole('tab',{name:'Aperçu'});expect(overview.getAttribute('aria-selected')).toBe('true');
 fireEvent.keyDown(overview,{key:'ArrowRight'});await waitFor(()=>expect(screen.getByRole('tab',{name:'Médias'}).getAttribute('aria-selected')).toBe('true'));
 expect(await screen.findByRole('tabpanel')).toBeTruthy();
});
