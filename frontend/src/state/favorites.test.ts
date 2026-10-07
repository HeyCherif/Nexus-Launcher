// @vitest-environment jsdom
import {test,expect,afterEach,vi} from 'vitest';
import {useNexusStore} from './useNexusStore';
afterEach(()=>{vi.restoreAllMocks();localStorage.clear();useNexusStore.setState({favoriteIds:[]});});
test('favorites persist and can be removed without modifying games',()=>{const store=useNexusStore.getState();store.toggleFavorite('local-one');expect(useNexusStore.getState().favoriteIds).toEqual(['local-one']);expect(JSON.parse(localStorage.getItem('nexus.favorites.v1')!)).toEqual(['local-one']);store.toggleFavorite('local-one');expect(useNexusStore.getState().favoriteIds).toEqual([]);});
test('failed persistence leaves favorite state unchanged',()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('quota');});expect(()=>useNexusStore.getState().toggleFavorite('one')).toThrow();expect(useNexusStore.getState().favoriteIds).toEqual([]);});
