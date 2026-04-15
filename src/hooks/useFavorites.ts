import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("profile_id")
        .eq("user_id", userId);
      if (error) throw error;
      return data.map((r) => r.profile_id);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Use a Set for O(1) lookups instead of Array.includes
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const addMutation = useMutation({
    mutationFn: async (profileId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_favorites")
        .insert({ user_id: userId, profile_id: profileId });
      if (error) throw error;
    },
    onMutate: async (profileId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites", userId] });
      const prev = queryClient.getQueryData<string[]>(["favorites", userId]) ?? [];
      queryClient.setQueryData(["favorites", userId], [...prev, profileId]);
      return { prev };
    },
    onError: (_err, _profileId, context) => {
      queryClient.setQueryData(["favorites", userId], context?.prev ?? []);
      toast.error("Erro ao adicionar favorito");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (profileId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("profile_id", profileId);
      if (error) throw error;
    },
    onMutate: async (profileId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites", userId] });
      const prev = queryClient.getQueryData<string[]>(["favorites", userId]) ?? [];
      queryClient.setQueryData(["favorites", userId], prev.filter((id) => id !== profileId));
      return { prev };
    },
    onError: (_err, _profileId, context) => {
      queryClient.setQueryData(["favorites", userId], context?.prev ?? []);
      toast.error("Erro ao remover favorito");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
    },
  });

  const toggleFavorite = useCallback(
    (profileId: string) => {
      if (!userId) {
        toast.error("Faça login para favoritar");
        return;
      }
      if (favoriteSet.has(profileId)) {
        removeMutation.mutate(profileId);
      } else {
        addMutation.mutate(profileId);
      }
    },
    [userId, favoriteSet, addMutation, removeMutation]
  );

  const isFavorited = useCallback(
    (profileId: string) => favoriteSet.has(profileId),
    [favoriteSet]
  );

  return { favoriteIds, isLoading, toggleFavorite, isFavorited, isToggling: addMutation.isPending || removeMutation.isPending };
}
