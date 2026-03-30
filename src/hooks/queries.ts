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

type StaticQueryHookOptions = {
  enabled?: boolean;
};

export const useItems = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Record<string, Item>, Error> => {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useCharacters = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Record<string, Character>, Error> => {
  return useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useMonsters = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Record<string, Monster>, Error> => {
  return useQuery({
    queryKey: ['monsters'],
    queryFn: fetchMonsters,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useChests = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Chest[], Error> => {
  return useQuery({
    queryKey: ['chests'],
    queryFn: fetchChests,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useFestivals = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Festival[], Error> => {
  return useQuery({
    queryKey: ['festivals'],
    queryFn: fetchFestivals,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useCrops = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<CropsData, Error> => {
  return useQuery({
    queryKey: ['crops'],
    queryFn: fetchCrops,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useFish = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Fish[], Error> => {
  return useQuery({
    queryKey: ['fish'],
    queryFn: fetchFish,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useOrders = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Order[], Error> => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useRequests = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Record<string, RequestItem[]>, Error> => {
  return useQuery({
    queryKey: ['requests'],
    queryFn: fetchRequests,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useRuneAbilities = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Record<string, RuneAbility[]>, Error> => {
  return useQuery({
    queryKey: ['runeAbilities'],
    queryFn: fetchRuneAbilities,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useSkills = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<SkillsData, Error> => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useTrophies = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<Record<string, Trophy[]>, Error> => {
  return useQuery({
    queryKey: ['trophies'],
    queryFn: fetchTrophies,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};

export const useCrafterData = ({ enabled = true }: StaticQueryHookOptions = {}): UseQueryResult<CrafterData, Error> => {
  return useQuery({
    queryKey: ['crafter'],
    queryFn: fetchCrafterData,
    enabled,
    ...STATIC_QUERY_OPTIONS,
  });
};
