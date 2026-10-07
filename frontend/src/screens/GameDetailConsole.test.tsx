// @vitest-environment jsdom
import '../i18n';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {test,expect,afterEach} from 'vitest';
import {GameDetailScreen} from './GameDetailScreen';
import {useNexusStore} from '../state/useNexusStore';
import type { Game } from '../types';
const game:Game={id:'real',title:'My Game',description:{fr:'Description du jeu',en:'Game description'},genre:{fr:'Action',en:'Action'},metadata:[],artwork:'/cover.jpg',installed:true,source:'Steam',developer:'Studio',publisher:'Publisher',releaseDate:'2026',ageRating:'Non renseigné',playtimeHours:0,lastPlayed:{fr:'Date dossier',en:'Folder date'},version:'',installSize:'',achievementProgress:{unlocked:0,total:0},rating:0,trailer:{title:{fr:'Trailer',en:'Trailer'},duration:''},features:[],discovered:true,screenshots:['/one.jpg','/two.jpg']};
afterEach(()=>{cleanup();localStorage.clear();useNexusStore.setState({favoriteIds:[]});});
test('console detail exposes activity and keeps utility actions in an accessible menu',async()=>{
 useNexusStore.setState({discoveredGames:[{...game,id:'console-test',discovered:true}],libraryScanState:'ready',locale:'fr'});
 render(<MemoryRouter initialEntries={['/game/console-test']}><Routes><Route path='/game/:gameId' element={<GameDetailScreen onLaunch={()=>{}}/>}/></Routes></MemoryRouter>);
 expect(screen.getByRole('tab',{name:'Activité'})).toBeTruthy();
 fireEvent.keyDown(screen.getByRole('button',{name:'Plus d’options'}),{key:'Enter'});
 expect(await screen.findByRole('menuitem',{name:'Personnaliser'})).toBeTruthy();
 expect(screen.queryByText('Up to date')).toBeNull();
 fireEvent.click(screen.getByRole('menuitem',{name:'Ajouter aux favoris'}));
 expect(JSON.parse(localStorage.getItem('nexus.favorites.v1')||'[]')).toEqual(['console-test']);
});


test('back to library does not return to the previous settings route',()=>{
 useNexusStore.setState({discoveredGames:[game],libraryScanState:'ready',locale:'fr'});
 render(<MemoryRouter initialEntries={['/settings','/game/real']} initialIndex={1}><Routes><Route path='/game/:gameId' element={<GameDetailScreen onLaunch={()=>{}}/>}/><Route path='/library' element={<h1>Library destination</h1>}/><Route path='/settings' element={<h1>Settings destination</h1>}/></Routes></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Retour à la bibliothèque'}));expect(screen.getByRole('heading',{name:'Library destination'})).toBeTruthy();
});


