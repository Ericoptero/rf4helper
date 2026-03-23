import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchItems, fetchCharacters, fetchMonsters, fetchChests, fetchFestivals, fetchCrops, fetchFish, fetchOrders, fetchRequests, fetchRuneAbilities, fetchSkills, fetchTrophies, fetchCrafterData } from '../lib/api';
import type { Item, Character, Monster, Chest, Festival, CropsData, Fish, Order, RequestItem, RuneAbility, SkillsData, Trophy, CrafterData } from '../lib/schemas';

/**
 * All game data is static — it never changes at runtime.
 * Using Infinity for staleTime and gcTime ensures we fetch only
 * once per session and never garbage-collect the cached data.
 */
const STATIC_QUERY_OPTIONS = {
  staleTime: Infinity,
  gcTime: Infinity,
} as const;

export const useItems = (): UseQueryResult<Record<string, Item>, Error> => {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useCharacters = (): UseQueryResult<Record<string, Character>, Error> => {
  return useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useMonsters = (): UseQueryResult<Record<string, Monster>, Error> => {
  return useQuery({
    queryKey: ['monsters'],
    queryFn: fetchMonsters,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useChests = (): UseQueryResult<Chest[], Error> => {
  return useQuery({
    queryKey: ['chests'],
    queryFn: fetchChests,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useFestivals = (): UseQueryResult<Festival[], Error> => {
  return useQuery({
    queryKey: ['festivals'],
    queryFn: fetchFestivals,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useCrops = (): UseQueryResult<CropsData, Error> => {
  return useQuery({
    queryKey: ['crops'],
    queryFn: fetchCrops,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useFish = (): UseQueryResult<Fish[], Error> => {
  return useQuery({
    queryKey: ['fish'],
    queryFn: fetchFish,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useOrders = (): UseQueryResult<Order[], Error> => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useRequests = (): UseQueryResult<Record<string, RequestItem[]>, Error> => {
  return useQuery({
    queryKey: ['requests'],
    queryFn: fetchRequests,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useRuneAbilities = (): UseQueryResult<Record<string, RuneAbility[]>, Error> => {
  return useQuery({
    queryKey: ['runeAbilities'],
    queryFn: fetchRuneAbilities,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useSkills = (): UseQueryResult<SkillsData, Error> => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useTrophies = (): UseQueryResult<Record<string, Trophy[]>, Error> => {
  return useQuery({
    queryKey: ['trophies'],
    queryFn: fetchTrophies,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useCrafterData = (): UseQueryResult<CrafterData, Error> => {
  return useQuery({
    queryKey: ['crafter'],
    queryFn: fetchCrafterData,
    ...STATIC_QUERY_OPTIONS,
  });
};
