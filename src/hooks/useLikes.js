import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export function useLikes(targetType, targetIds) {
  const { isAuthenticated } = useAuth();
  const ids = (targetIds || []).slice().sort();
  const key = ids.join(",");

  const { data = [] } = useQuery({
    queryKey: ["my-likes", targetType, key],
    queryFn: async () => {
      const res = await base44.functions.invoke("getMyLikes", {
        target_type: targetType,
        target_ids: ids,
      });
      return res.data.liked_ids || [];
    },
    enabled: isAuthenticated && ids.length > 0,
  });

  return new Set(data);
}