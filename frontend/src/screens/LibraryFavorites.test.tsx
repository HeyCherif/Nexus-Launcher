// @vitest-environment jsdom
import '../i18n';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {test,expect,afterEach} from 'vitest';
import {LibraryScreen} from './LibraryScreen';
import {useNexusStore} from '../state/useNexusStore';
import type {Game} from '../types';
const game:Game={id:'real',title:'My Game',description:{fr:'Description du jeu',en:'Game description'},genre:{fr:'Action',en:'Action'},metadata:[],artwork:'/cover.jpg',installed:true,source:'Steam',developer:'Studio',publisher:'Publisher',releaseDate:'2026',ageRating:'Non renseigné',playtimeHours:0,lastPlayed:{fr:'Date dossier',en:'Folder date'},version:'',installSize:'',achievementProgress:{unlocked:0,total:0},rating:0,trailer:{title:{fr:'Trailer',en:'Trailer'},duration:''},features:[],discovered:true,screenshots:['/one.jpg','/two.jpg']};
afterEach(()=>{cleanup();useNexusStore.setState({favoriteIds:[],discoveredGames:[]});});
test('favorites can be reset without hiding the rest of the library',()=>{
 useNexusStore.setState({locale:'fr',discoveredGames:[{...game,id:'alpha',title:'Alpha'},{...game,id:'beta',title:'Beta'}],favoriteIds:['beta'],libraryScanState:'ready'});
 render(<MemoryRouter><LibraryScreen/></MemoryRouter>);
 expect(screen.getByRole('button',{name:/Alpha/})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:/^Favoris/}));
 expect(screen.queryByRole('button',{name:/Alpha/})).toBeNull();expect(screen.getByRole('button',{name:/Beta/})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Effacer les filtres'}));expect(screen.getByRole('button',{name:/Alpha/})).toBeTruthy();
});

