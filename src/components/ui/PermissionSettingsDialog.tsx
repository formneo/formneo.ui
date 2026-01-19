import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    TextField,
    Divider,
    Chip,
    Stack,
} from "@mui/material";
// import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { PermissionLevel, ScreenPermission } from "lib/permissions/types";
import { upsertScreenPermission } from "lib/permissions/storage";
import { ACTION_KEYS, ActionsMask, fromMask, maskHas, maskToggle, toMask, toNumericActions, numbersToMask } from "lib/permissions/actions";
import { upsertAllPermissions, getPermissionsByResource } from "lib/permissions/service";
import { UserApi } from "api/generated/api";
import getConfiguration from "confiuration";

type Props = {
    open: boolean;
    onClose: () => void;
    screenId: string;
    resourceKey?: string; // opsiyonel: doğrudan backend resource key
};

type SimpleUser = { id: string; name: string; email?: string };

// Seviye butonları kaldırıldı; sadece action-mask toggle kullanılacak

export default function PermissionSettingsDialog({ open, onClose, screenId, resourceKey }: Props): JSX.Element {
    const [defaultLevel, setDefaultLevel] = useState<PermissionLevel>("full");
    const [defaultMask, setDefaultMask] = useState<number>(ActionsMask.View);
    const [isCustom, setIsCustom] = useState<boolean>(false);
    const [userQuery, setUserQuery] = useState<string>("");
    const [userOptions, setUserOptions] = useState<SimpleUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Record<string, SimpleUser>>({});
    const [overrides, setOverrides] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const canSave = useMemo(() => !isCustom || (isCustom && Object.keys(overrides).length >= 1), [isCustom, overrides]);

    async function searchUsers(q: string) {
        setUserQuery(q);
        try {
            const conf = getConfiguration();
            const api = new UserApi(conf);
            let list: any[] = [];
            if (q && q.trim() !== "") {
                const res = await api.apiUserGetAllWithOuthPhotoGet();
                list = (res as any)?.data || [];
            } else {
                const res = await api.apiUserGetAllWithOuthPhotoGet();
                list = (res as any)?.data || [];
            }
            const items: SimpleUser[] = list.map((u: any) => ({ id: String(u.id || u.userId || ""), name: u.userName || u.name || u.fullName || u.label || "Kullanıcı" }));
            setUserOptions(items);
        } catch {
            setUserOptions([]);
        }
    }

    async function loadInitialUsers() {
        try {
            const conf = getConfiguration();
            const api = new UserApi(conf);
            const res = await api.apiUserGetAllWithOuthPhotoGet();
            const list: any[] = (res as any)?.data || [];
            const items: SimpleUser[] = list.map((u: any) => ({ id: String(u.id || u.userId || ""), name: u.userName || u.name || u.fullName || u.label || "Kullanıcı" }));
            setUserOptions(items);
        } catch {
            setUserOptions([]);
        }
    }

    function addOverride(userId: string, mask: number) {
        setOverrides((curr) => ({ ...curr, [userId]: mask }));
    }

    function removeOverride(userId: string) {
        setOverrides((curr) => {
            const next = { ...curr };
            delete next[userId];
            return next;
        });
        setSelectedUsers((curr) => {
            const next = { ...curr };
            delete next[userId];
            return next;
        });
    }

    async function handleSave() {
        setSaving(true);
        const rk = resourceKey || screenIdToResourceKey(screenId);
        const users = isCustom
            ? Object.entries(overrides).map(([userId, mask]) => ({ userId, allowedMask: mask, deniedMask: 0 }))
            : [];

        await upsertAllPermissions({ resource: { resourceKey: rk, mask: defaultMask, actions: toNumericActions(defaultMask) as any }, users });

        // local design-time state de senkron
        const payload: ScreenPermission = {
            screenId,
            defaultLevel,
            overrides: Object.fromEntries(Object.entries(overrides).map(([k, m]) => [k, maskToLevel(m)])),
            updatedAt: new Date().toISOString(),
        };
        upsertScreenPermission(payload);
        setSaving(false);
        onClose();
    }

    function screenIdToResourceKey(id: string): string {
        // Basit eşleme; gerekirse tabloya taşıyabiliriz
        const map: Record<string, string> = {
            customers: "customer",
            projects: "project",
        };
        return map[id] || id[0].toUpperCase() + id.slice(1);
    }

    function maskToLevel(mask: number): PermissionLevel {
        const hasFull = ACTION_KEYS.every((k) => maskHas(mask, k));
        if (hasFull) return "full";
        const canDelete = maskHas(mask, "Delete");
        const canCreateOrUpdate = maskHas(mask, "Create") || maskHas(mask, "Update");
        if (canDelete) return "delete";
        if (canCreateOrUpdate) return "create_edit";
        return "view";
    }

    // Open olduğunda mevcut yetkileri backend'den yükle
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!open) return;
            try {
                setLoading(true);
                const rk = resourceKey || screenIdToResourceKey(screenId);
                const res = await getPermissionsByResource(rk);
                if (!mounted || !res) return;
                // default mask: resource.mask varsa onu kullan, yoksa actions listesinden (numeric/string) hesapla
                const payload: any = res || {};
                const resource = payload.resource || {};
                const acts: any[] = Array.isArray(resource.actions) ? resource.actions : [];
                let m: number = 0;
                // 1) Yeni şema: top-level defaultMask
                if (typeof payload.defaultMask === "number") {
                    m = payload.defaultMask;
                } else if (typeof payload.defaultMask === "string" && /^\d+$/.test(payload.defaultMask)) {
                    m = Number(payload.defaultMask);
                // 2) Eski/alternatif şema: resource.mask / resource.actions
                } else if (typeof resource.mask === "number") {
                    m = resource.mask;
                } else if (typeof resource.mask === "string" && /^\d+$/.test(resource.mask)) {
                    m = Number(resource.mask);
                } else if (acts.length > 0) {
                    if (typeof acts[0] === "number") m = numbersToMask(acts as number[]);
                    else if (typeof acts[0] === "string" && /^\d+$/.test(acts[0] as string)) m = numbersToMask((acts as string[]).map((s) => Number(s)));
                    else m = toMask(acts as any);
                } else {
                    m = 0;
                }
                setDefaultMask(m || ActionsMask.View);
                setDefaultLevel(maskToLevel(m || ActionsMask.View));
                // overrides
                const list: any[] = Array.isArray((res as any)?.users) ? (res as any).users : [];
                const next: Record<string, number> = {};
                for (const u of list) {
                    const uid = String(u.userId || u.id || "");
                    const allowed = typeof u.allowedMask === "number"
                        ? u.allowedMask
                        : (typeof u.allowedMask === "string" && /^\d+$/.test(u.allowedMask) ? Number(u.allowedMask) : 0);
                    if (uid) next[uid] = allowed;
                }
                setOverrides(next);
                setIsCustom(Object.keys(next).length > 0);
                await loadInitialUsers();
            } catch {
                /* ignore */
            } finally {
                setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [open, screenId]);

    // Mask değişince seviye otomatik senkron
    useEffect(() => {
        setDefaultLevel(maskToLevel(defaultMask));
    }, [defaultMask]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>İşlemler · Yetki Ayarları</DialogTitle>
            <DialogContent>
                <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>
                    Bu ekran için varsayılan yetki seviyesini belirleyin. İsterseniz belirli kullanıcılar için özel seviyeler atayın.
                </div>

                <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Varsayılan Yetki</div>
                {/* Action bazlı toggle (mask) */}
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                    {ACTION_KEYS.map((k) => (
                        <Chip
                            key={k}
                            label={k}
                            color={maskHas(defaultMask, k) ? "info" : "default"}
                            variant={maskHas(defaultMask, k) ? "filled" : "outlined"}
                            onClick={() => { if (!loading && !saving) setDefaultMask((m) => maskToggle(m, k)); }}
                            disabled={loading || saving}
                        />
                    ))}
                    <Button size="small" onClick={() => setDefaultMask(ActionsMask.View)} disabled={loading || saving}>
                        Sadece Görüntüle
                    </Button>
                    <Button size="small" onClick={() => setDefaultMask(ActionsMask.View | ActionsMask.Create | ActionsMask.Update)} disabled={loading || saving}>
                        Oluştur & Düzenle
                    </Button>
                    <Button size="small" onClick={() => setDefaultMask(ActionsMask.View | ActionsMask.Create | ActionsMask.Update | ActionsMask.Delete)} disabled={loading || saving}>
                        Sil Dahil
                    </Button>
                    <Button size="small" onClick={() => setDefaultMask(ActionsMask.View | ActionsMask.Create | ActionsMask.Update | ActionsMask.Delete | ActionsMask.Export)} disabled={loading || saving}>
                        Full
                    </Button>
                </Stack>

                <FormControlLabel
                    control={<Switch checked={isCustom} onChange={(e) => setIsCustom(e.target.checked)} disabled={loading || saving} />}
                    label="Özel (kullanıcı bazlı atama)"
                />

                {isCustom && (
                    <div style={{ marginTop: 8 }}>
                        <Autocomplete
                            options={userOptions}
                            getOptionLabel={(o) => o.name}
                            onInputChange={(_, v) => searchUsers(v)}
                            onChange={(_, v) => {
                                if (v?.id) {
                                    setSelectedUsers((curr) => ({ ...curr, [v.id]: v }));
                                    addOverride(v.id, overrides[v.id] ?? ActionsMask.View);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Kullanıcı ara" placeholder="Ad..." size="small" disabled={loading || saving} />
                            )}
                            disabled={loading || saving}
                        />

                        {Object.keys(overrides).length > 0 && (
                            <>
                                <Divider sx={{ my: 1.5 }} />
                                <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Özel Atamalar</div>
                                <Stack direction="column" spacing={1}>
                                    {Object.entries(overrides).map(([uid, mask]) => (
                                        <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Chip
                                                label={selectedUsers[uid]?.name || uid}
                                                onDelete={() => removeOverride(uid)}
                                                variant="outlined"
                                            />
                                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                                {ACTION_KEYS.map((k) => (
                                                    <Chip
                                                        key={k}
                                                        label={k}
                                                        color={maskHas(mask, k) ? "info" : "default"}
                                                        variant={maskHas(mask, k) ? "filled" : "outlined"}
                                                        onClick={() => { if (!loading && !saving) addOverride(uid, maskToggle(mask, k)); }}
                                                        disabled={loading || saving}
                                                    />
                                                ))}
                                            </Stack>
                                        </div>
                                    ))}
                                </Stack>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>İptal</Button>
                <Button disabled={!canSave} onClick={handleSave} variant="contained">Kaydet</Button>
            </DialogActions>
        </Dialog>
    );
}


