import React, { useEffect, useMemo, useState } from "react";
import { Card, Grid } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { Tree } from "primereact/tree";
import { RoleTenantMenuApi, UserRoleAssignmentGetDto, UserRoleAssignmentItemDto } from "api/generated";
import getConfiguration from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { MessageBoxType } from "@ui5/webcomponents-react";

type TreeNode = any;

type Props = {
    userId?: string;
};

function UserTenantRoles({ userId }: Props): JSX.Element {
    const [nodes, setNodes] = useState<TreeNode[]>([]);
    const [selectionKeys, setSelectionKeys] = useState<any>({});
    const [expandedKeys, setExpandedKeys] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [originalSelection, setOriginalSelection] = useState<any>({});
    const dispatchAlert = useAlert();

    const hasChanges = useMemo(() => {
        const currentKeys = Object.keys(selectionKeys).filter(k => selectionKeys[k]?.checked);
        const originalKeys = Object.keys(originalSelection).filter(k => originalSelection[k]?.checked);
        if (currentKeys.length !== originalKeys.length) return true;
        return currentKeys.some(k => !originalSelection[k]?.checked) ||
            originalKeys.some(k => !selectionKeys[k]?.checked);
    }, [selectionKeys, originalSelection]);

    const renderNode = (node: any) => {
        const isRole = String(node?.key || "").startsWith("role:");
        const isLocked = Boolean(node?.data?.isLocked);
        const isActive = node?.data?.isActive === undefined ? true : Boolean(node?.data?.isActive);
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", lineHeight: "22px" }}>
                <i className={`pi ${isRole ? "pi-shield" : "pi-box"}`} style={{ fontSize: isRole ? 16 : 15, opacity: 0.85 }} />
                <span style={{ fontWeight: isRole ? 600 : 500 }}>{node?.label}</span>
                {isLocked && (
                    <i className="pi pi-lock" title="Kilitli rol" style={{ marginLeft: 6, fontSize: 14, color: "#6b7280" }} />
                )}
                <i
                    className="pi pi-circle-fill"
                    title={isActive ? "Aktif" : "Pasif"}
                    style={{ marginLeft: 4, fontSize: 10, color: isActive ? "#16a34a" : "#9ca3af" }}
                />
            </div>
        );
    };

    const expandAll = () => {
        const all: any = {};
        const walk = (n: any[]) => {
            (n || []).forEach((x) => {
                all[x.key] = true;
                if ((x.children || []).length > 0) walk(x.children);
            });
        };
        walk(nodes);
        setExpandedKeys(all);
    };

    const collapseAll = () => setExpandedKeys({});

    useEffect(() => {
        const load = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const conf = getConfiguration();
                const api = new RoleTenantMenuApi(conf);

                // GetUserRoleAssignments: API'den dönen veri yapısı { userId, tenantId, roles: [...] }
                const tenantId = localStorage.getItem("selectedTenantId");
                if (!tenantId) {
                    dispatchAlert({ message: "Tenant ID bulunamadı", type: MessageBoxType.Warning });
                    return;
                }
                
                const res = await api.apiRoleTenantMenuUserRoleAssignmentsGet(userId, tenantId);
                const raw: UserRoleAssignmentGetDto = res?.data as UserRoleAssignmentGetDto;
                
                // API'den dönen veri yapısı: { userId, tenantId, roles: [...] }
                const list: UserRoleAssignmentItemDto[] = Array.isArray(raw?.roles) 
                    ? raw.roles 
                    : [];

                // Sadece rol düğümleri - UserRoleAssignmentItemDto yapısına göre
                const roleNodes: TreeNode[] = (list || []).map((r: UserRoleAssignmentItemDto) => {
                    const roleId = String(r.roleId || "");
                    const roleName = r.roleName || roleId || "Bilinmeyen Rol";
                    return {
                        key: `role:${roleId}`,
                        label: roleName,
                        children: [],
                        data: {
                            isLocked: Boolean(r.isLocked),
                            isActive: r.isActive ?? true,
                        },
                        selectable: true,
                    } as TreeNode;
                });

                // Seçimler: isAssignedToUser alanına göre işaretle
                const sel: any = {};
                (list || []).forEach((r: UserRoleAssignmentItemDto) => {
                    const roleId = String(r.roleId || "");
                    const isAssigned = Boolean(r.isAssignedToUser);
                    if (roleId && isAssigned) {
                        sel[`role:${roleId}`] = { checked: true };
                    }
                });

                setNodes(roleNodes);
                setSelectionKeys(sel);
                setOriginalSelection(sel);
            } catch (e) {
                setNodes([]);
                setSelectionKeys({});
                setOriginalSelection({});
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    const handleSave = async () => {
        if (!userId || !hasChanges) return;

        setSaving(true);
        try {
            const conf = getConfiguration();
            const api = new RoleTenantMenuApi(conf);

            // Rol atama payload'ı
            const roleAssignments = (nodes || []).map((n: any) => {
                const roleId = String((n.key || '').toString().split(':')[1] || '');
                const shouldAssign = Boolean(selectionKeys[n.key]?.checked);
                return { roleId, shouldAssign } as any;
            });

            const tenantId = localStorage.getItem("selectedTenantId");
            if (!tenantId) throw new Error("Tenant ID bulunamadı");

            await api.apiRoleTenantMenuUserRoleAssignmentsPost({
                userId: String(userId),
                tenantId: String(tenantId),
                roleAssignments,
            } as any);

            setOriginalSelection({ ...selectionKeys });
            dispatchAlert({ message: "Roller başarıyla kaydedildi", type: MessageBoxType.Success });
        } catch (error: any) {
            dispatchAlert({ message: error?.response?.data?.errors?.[0] || "Kaydetme sırasında hata oluştu", type: MessageBoxType.Error });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card style={{ borderRadius: 14, margin: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
            <MDBox p={2} display="flex" alignItems="center" justifyContent="space-between" sx={{ position: "sticky", top: 0, zIndex: 1, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
                <MDBox display="flex" alignItems="center" gap={1}>
                    <i className="pi pi-users" style={{ fontSize: 18, opacity: 0.9 }} />
                    <MDTypography variant="h6">Tenant Rolleri</MDTypography>
                </MDBox>
                <MDBox display="flex" alignItems="center" gap={1}>
                    <MDButton variant="outlined" color="secondary" size="small" onClick={expandAll}>Hepsini Aç</MDButton>
                    <MDButton variant="outlined" color="secondary" size="small" onClick={collapseAll}>Hepsini Kapat</MDButton>
                    <MDButton
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => {
                            const allSel: any = {};
                            (nodes || []).forEach((n: any) => {
                                allSel[n.key] = { checked: true };
                            });
                            setSelectionKeys(allSel);
                        }}
                    >
                        Hepsini Seç
                    </MDButton>
                    <MDButton variant="outlined" color="secondary" size="small" onClick={() => setSelectionKeys({})}>Hepsini Kaldır</MDButton>
                    <MDButton
                        variant="gradient"
                        color="info"
                        size="small"
                        disabled={!hasChanges || saving}
                        onClick={handleSave}
                        startIcon={saving ? <i className="pi pi-spin pi-spinner" /> : <i className="pi pi-save" />}
                    >
                        {saving ? "Kaydediliyor..." : "Rolleri Kaydet"}
                    </MDButton>
                </MDBox>
            </MDBox>
            {hasChanges && (
                <MDBox px={3} py={1} sx={{ bgcolor: "warning.light", color: "warning.contrastText", borderRadius: 1, mb: 2 }}>
                    <MDTypography variant="caption">
                        <i className="pi pi-exclamation-triangle" style={{ marginRight: 8 }} />
                        Değişiklikler kaydedilmedi. &quot;Rolleri Kaydet&quot; butonuna tıklayarak değişiklikleri saklayın.
                    </MDTypography>
                </MDBox>
            )}
            <MDBox px={3} py={2} style={{ maxHeight: 560, overflow: "auto" }}>
                <MDBox style={{ background: "#f9fafb", borderRadius: 12, border: "1px solid #e8e8e8", padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)" }}>
                    <Tree
                        value={nodes}
                        selectionMode="checkbox"
                        selectionKeys={selectionKeys}
                        expandedKeys={expandedKeys}
                        nodeTemplate={renderNode}
                        onSelectionChange={(e: any) => setSelectionKeys(e.value || {})}
                        onExpand={(e: any) => setExpandedKeys(e.value || {})}
                        onCollapse={(e: any) => setExpandedKeys(e.value || {})}
                        className="w-full"
                    />
                    {(nodes || []).length === 0 && !loading && (
                        <MDTypography variant="button" color="text">Kayıt bulunamadı.</MDTypography>
                    )}
                </MDBox>
            </MDBox>
        </Card>
    );
}

export default UserTenantRoles;



