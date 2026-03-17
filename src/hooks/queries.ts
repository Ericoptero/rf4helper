import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchItems, fetchCharacters, fetchMonsters } from '../lib/api';
import type { Item, Character, Monster } from '../lib/schemas';

export const useItems = (): UseQueryResult<Record<string, Item>, Error> => {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    staleTime: 1000 * 60 * 60, // 1 hour (static data)
  });
};

export const useCharacters = (): UseQueryResult<Record<string, Character>, Error> => {
  return useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: 1000 * 60 * 60,
  });
};

export const useMonsters = (): UseQueryResult<Record<string, Monster>, Error> => {
  return useQuery({
    queryKey: ['monsters'],
    queryFn: fetchMonsters,
    staleTime: 1000 * 60 * 60,
  });
};
