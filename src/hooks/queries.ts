import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchItems, fetchCharacters, fetchMonsters, fetchChests, fetchFestivals, fetchCrops, fetchFish, fetchOrders, fetchRequests, fetchRuneAbilities, fetchSkills, fetchTrophies } from '../lib/api';
import type { Item, Character, Monster, Chest, Festival, CropsData, Fish, Order, RequestItem, RuneAbility, Skill, Trophy } from '../lib/schemas';

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

export const useChests = (): UseQueryResult<Chest[], Error> => {
  return useQuery({
    queryKey: ['chests'],
    queryFn: fetchChests,
    staleTime: 1000 * 60 * 60,
  });
};

export const useFestivals = (): UseQueryResult<Festival[], Error> => {
  return useQuery({
    queryKey: ['festivals'],
    queryFn: fetchFestivals,
    staleTime: 1000 * 60 * 60,
  });
};

export const useCrops = (): UseQueryResult<CropsData, Error> => {
  return useQuery({
    queryKey: ['crops'],
    queryFn: fetchCrops,
    staleTime: 1000 * 60 * 60,
  });
};

export const useFish = (): UseQueryResult<Fish[], Error> => {
  return useQuery({
    queryKey: ['fish'],
    queryFn: fetchFish,
    staleTime: 1000 * 60 * 60,
  });
};

export const useOrders = (): UseQueryResult<Order[], Error> => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 60,
  });
};

export const useRequests = (): UseQueryResult<Record<string, RequestItem[]>, Error> => {
  return useQuery({
    queryKey: ['requests'],
    queryFn: fetchRequests,
    staleTime: 1000 * 60 * 60,
  });
};

export const useRuneAbilities = (): UseQueryResult<Record<string, RuneAbility[]>, Error> => {
  return useQuery({
    queryKey: ['runeAbilities'],
    queryFn: fetchRuneAbilities,
    staleTime: 1000 * 60 * 60,
  });
};

export const useSkills = (): UseQueryResult<Skill[], Error> => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    staleTime: 1000 * 60 * 60,
  });
};

export const useTrophies = (): UseQueryResult<Record<string, Trophy[]>, Error> => {
  return useQuery({
    queryKey: ['trophies'],
    queryFn: fetchTrophies,
    staleTime: 1000 * 60 * 60,
  });
};
