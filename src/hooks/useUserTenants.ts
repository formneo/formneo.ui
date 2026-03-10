import { useQuery } from "react-query";
import { UserApi, UserTenantsApi } from "api/generated";
import getConfiguration from "confiuration";

export type TenantOption = { id: string; label: string; name: string };

/**
 * Kullanıcının tenant listesini cache'leyen hook.
 * Navbar her sayfada mount olsa bile API sadece bir kez (veya cache süresi dolunca) çağrılır.
 * @param enabled false ise istek atılmaz (örn. login sayfasında)
 */
export const useUserTenants = (enabled: boolean = true) => {
  const fetchUserTenants = async (): Promise<TenantOption[]> => {
    const conf = getConfiguration();
    const userApi = new UserApi(conf);
    const user = await userApi.apiUserGetLoginUserDetailGet();
    const userId = String((user as any)?.data?.id || (user as any)?.data?.userId || "");
    if (!userId) return [];

    const utApi = new UserTenantsApi(conf);
    const res = await utApi.apiUserTenantsByUserUserIdGet(userId);
    const upayload: any = (res as any)?.data;
    const ulist: any[] = Array.isArray(upayload)
      ? upayload
      : Array.isArray(upayload?.items)
        ? upayload.items
        : Array.isArray(upayload?.data)
          ? upayload.data
          : Array.isArray(upayload?.result)
            ? upayload.result
            : [];

    const opts = Array.from(
      new Map(
        (ulist || []).map((r: any) => {
          const id = String(r.tenantId || r.id || r.clientId || r.uid || "");
          const label = r.tenantName || r.name || r.clientName || r.title || "-";
          return [id, { id, label, name: label }];
        })
      ).values()
    ) as TenantOption[];
    return opts;
  };

  return useQuery<TenantOption[], Error>("userTenants", fetchUserTenants, {
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika taze
    cacheTime: 1000 * 60 * 30, // 30 dakika önbellekte
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Sayfa değişince navbar yeniden mount olsa bile cache'den kullan
    retry: 1,
  });
};
