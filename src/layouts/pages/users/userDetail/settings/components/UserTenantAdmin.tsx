import React, { useEffect, useMemo, useState } from "react";
import { Card, Checkbox, Icon, List, ListItem, ListItemIcon, ListItemText, Typography, Chip } from "@mui/material";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import getConfiguration from "confiuration";
import { RoleTenantMenuApi, UserTenantsApi, UserTenantWithAdminFlagDto } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { MessageBoxType } from "@ui5/webcomponents-react";

type Props = { userId?: string };

type TenantRow = {
    id: string;
    name: string;
    isAdmin: boolean;
    isActive?: boolean;
};


export default function UserTenantAdmin({ userId }: Props): JSX.Element {
    const dispatchBusy = useBusy();
    const dispatchAlert = useAlert();

    const [tenants, setTenants] = useState<TenantRow[]>([]);
    const [adminMap, setAdminMap] = useState<Record<string, boolean>>({});
    const [original, setOriginal] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);

    const hasChanges = useMemo(() => {
        const keys = new Set([...Object.keys(original), ...Object.keys(adminMap)]);
        for (const k of keys) {
            if (Boolean(original[k]) !== Boolean(adminMap[k])) return true;
        }
        return false;
    }, [original, adminMap]);

    useEffect(() => {
        const load = async () => {
            if (!userId || userId === "") {
                return;
            }
            
            try {
                dispatchBusy({ isBusy: true });
                const conf = getConfiguration();
                const utApi = new UserTenantsApi(conf);

                // Kullanıcının tenant bilgilerini ve admin durumunu getir
                const meTenantsRes = await utApi.apiUserTenantsByUserUserIdGet(String(userId));
                const list: UserTenantWithAdminFlagDto[] = (meTenantsRes as any)?.data || [];
                
                // Backend'den gelen tenantName alanını kullan
                const mapped: TenantRow[] = (list || []).map((x: UserTenantWithAdminFlagDto) => {
                    const tenantId = String(x.tenantId || x.id || "");
                    const tenantName = x.tenantName || x.pCname || `Tenant-${tenantId.slice(-8)}`;
                    
                    return {
                        id: tenantId,
                        name: tenantName,
                        isAdmin: Boolean(x.isTenantAdmin),
                        isActive: Boolean(x.isActive),
                    };
                });
                setTenants(mapped);

                // Admin durumunu haritaya çevir
                const map: Record<string, boolean> = {};
                (list || []).forEach((x: UserTenantWithAdminFlagDto) => {
                    const tid = String(x.tenantId || x.id || "");
                    if (tid) {
                        map[tid] = Boolean(x.isTenantAdmin);
                    }
                });
                setAdminMap(map);
                setOriginal(map);
            } catch (e: any) {
                dispatchAlert({ message: e?.response?.data?.errors?.[0] || "Veri yüklenemedi", type: MessageBoxType.Error });
            } finally {
                dispatchBusy({ isBusy: false });
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const toggle = (tenantId: string) => {
        setAdminMap((prev) => ({ ...prev, [tenantId]: !prev[tenantId] }));
    };

    const handleSave = async () => {
        if (!userId || !hasChanges) return;
        try {
            setSaving(true);
            const conf = getConfiguration();
            const roleApi = new RoleTenantMenuApi(conf);

            // MakeTenantAdmin endpoint'i ile tek seferde yetkilendirme yap
            const selectedTenantIds = Object.entries(adminMap)
                .filter(([, isAdmin]) => Boolean(isAdmin))
                .map(([tenantId]) => String(tenantId));

            await roleApi.apiRoleTenantMenuMakeTenantAdminPost({
                userId: String(userId),
                tenantIds: selectedTenantIds,
            } as any);

            setOriginal({ ...adminMap });
            dispatchAlert({ message: "Kayıt başarılı", type: MessageBoxType.Success });
        } catch (e: any) {
            dispatchAlert({ message: e?.response?.data?.errors?.[0] || "Kaydetme hatası", type: MessageBoxType.Error });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card style={{ borderRadius: 14, padding: 20 }}>
            <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                    Kullanıcı Tenantları ve Admin Yetkisi
                </Typography>
                <MDBox>
                    <MDButton variant="outlined" color="secondary" onClick={() => setAdminMap(original)} sx={{ mr: 1 }} disabled={!hasChanges}>
                        Vazgeç
                    </MDButton>
                    <MDButton variant="gradient" color="info" onClick={handleSave} disabled={!hasChanges || saving} startIcon={<Icon>save</Icon>}>
                        Kaydet
                    </MDButton>
                </MDBox>
            </MDBox>

            <List>
                {(tenants || []).map((t) => (
                    <ListItem key={t.id} divider sx={{ py: 1.25 }} secondaryAction={
                        <Checkbox edge="end" onChange={() => toggle(t.id)} checked={Boolean(adminMap[t.id])} />
                    }>
                        <ListItemIcon>
                            <Icon>business</Icon>
                        </ListItemIcon>
                        <ListItemText 
                            primary={
                                <MDBox display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body1" fontWeight={500}>
                                        {t.name}
                                    </Typography>
                                    {t.isActive === false && (
                                        <Chip 
                                            label="Pasif" 
                                            size="small" 
                                            color="warning" 
                                            variant="outlined"
                                        />
                                    )}
                                    {Boolean(adminMap[t.id]) && (
                                        <Chip 
                                            label="Admin" 
                                            size="small" 
                                            color="success" 
                                            variant="filled"
                                        />
                                    )}
                                </MDBox>
                            }
                        />
                    </ListItem>
                ))}
                {(!tenants || tenants.length === 0) && (
                    <MDBox p={2}>
                        <Typography variant="body2" color="text.secondary">Bu kullanıcının kayıtlı tenantı bulunamadı.</Typography>
                    </MDBox>
                )}
            </List>
        </Card>
    );
}


