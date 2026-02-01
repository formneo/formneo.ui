import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CustomerFilters from "../../components/customers/CustomerFilters";
import CustomerGrid from "../../components/customers/CustomerGrid";
import { CustomersApi } from "api/generated/api";
import { Customer } from "../../types/customer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SettingsMenuButton from "components/ui/SettingsMenuButton";
import { usePermissions } from "lib/permissions/hooks";
import PermissionSettingsDialog from "components/ui/PermissionSettingsDialog";
import SettingsIcon from "@mui/icons-material/Settings";
import Footer from "examples/Footer";
import getConfiguration from "confiuration";
import { useRegisterActions } from "context/ActionBarContext";
import AddIcon from "@mui/icons-material/Add";
import { GridView, TableChart } from "@mui/icons-material";
import DataGrid, { ColumnDef } from "../../components/ui/DataGrid";
import MuiCustomerGrid from "../../components/customers/MuiCustomerGrid";

export default function CustomersPage(): JSX.Element {
    const navigate = useNavigate();
    // Permissions (design-time only)
    const { can } = usePermissions("customers", undefined);
    const [params, setParams] = useSearchParams();
    const [all, setAll] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [permissionsOpen, setPermissionsOpen] = useState<boolean>(false);

    const q = params.get("q") ?? "";
    const sector = params.get("sector") ?? "";
    const tag = params.get("tag") ?? "";
    const status = params.get("status") ?? "";
    const sort = params.get("sort") ?? "recent";
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 20);
    const totalFromUrl = Number(params.get("total") ?? 0);

    const patch = (patch: Record<string, string>) => {
        const next = new URLSearchParams(params);
        Object.entries(patch).forEach(([k, v]) => v === "" ? next.delete(k) : next.set(k, v));
        if (!patch.page) next.set("page", "1");
        setParams(next, { replace: true });
    };

    // Action Bar: Yeni müşteri oluştur
    useRegisterActions([
        {
            id: "new-customer",
            label: "Yeni Müşteri",
            icon: <AddIcon fontSize="small" />,
            onClick: () => navigate("/customers/new"),
            disabled: !can.create,
        },
        {
            id: "permissions",
            label: "İşlemler",
            icon: <SettingsIcon fontSize="small" />,
            onClick: () => setPermissionsOpen(true),
        },
    ], [navigate, can.create]);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        const api = new CustomersApi(getConfiguration());
        
        // Server-side paging ile veri çek
        // Search parametresi direkt API'ye geçiliyor (case-insensitive için küçük harfe çevir)
        const searchParam = q ? q.toLowerCase().trim() : undefined;
        
        
        // Diğer filtreler şimdilik ignore edilecek (backend desteklemiyorsa)
        // TODO: Backend'de sector, tag, status, sort parametreleri eklenmeli
        
        api.apiCustomersPagedGet(page, pageSize, true, searchParam)
            .then((res: any) => {
                // Backend response yapısı:
                // {
                //   items: [],
                //   TotalCount: number,
                //   TotalPages: number, 
                //   Page: number,
                //   PageSize: number,
                //   HasNextPage: boolean,
                //   HasPreviousPage: boolean
                // }
                const data = res?.data?.items ?? [];
                // Backend TotalCount değerini al
                const totalCount = res?.data?.totalCount ?? 0;
                // Backend TotalPages yanlış olabilir, TotalCount'dan hesapla
                const calculatedTotalPages = Math.ceil(totalCount / pageSize);
                const totalPages = calculatedTotalPages; // Backend değerini ignore et
                const currentPage = res?.data?.page ?? page;
                const hasNext = res?.data?.hasNextPage ?? (currentPage < totalPages);
                const hasPrev = res?.data?.hasPreviousPage ?? (currentPage > 1);
                
                const mapped: Customer[] = (data as any[]).map(normalizeCustomerFromDto);
                
                // Debug logs removed - search functionality ready
                
                if (isMounted) {
                    setAll(mapped);
                    // TotalCount'ı URL'ye ekle (pagination için)
                    if (totalCount !== 0) {
                        const next = new URLSearchParams(params);
                        next.set('total', String(totalCount));
                        setParams(next, { replace: true });
                    }
                }
            })
            .catch((error) => {
                console.error('Müşteri listesi yüklenemedi:', error);
                if (isMounted) setAll([]);
            })
            .finally(() => { if (isMounted) setLoading(false); });
        return () => { isMounted = false; };
    }, [page, pageSize, q, sector, tag, status, sort]); // Filtreler değiştiğinde de yeniden yükle

    // Filtreler değiştiğinde sayfa 1'e dön (arama sonuçları farklı sayfalarda olabilir)
    useEffect(() => {
        if (page !== 1) {
            patch({ page: "1" });
        }
    }, [q, sector, tag, status]); // Herhangi bir filtre değiştiğinde sayfa 1'e dön

    // Server-side paging kullanıyoruz, client-side filtreleme kaldırıldı
    const items = all; // API'den gelen veriler direkt kullanılıyor
    const total = totalFromUrl || all.length; // URL'den gelen total veya fallback
    
    // Pagination state debug logs removed

    const onClear = () => setParams(new URLSearchParams(), { replace: true });

    // DataGrid sütun tanımları
    const columns: ColumnDef<Customer>[] = [
        {
            key: 'name',
            title: 'Müşteri Adı',
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                                {row.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{row.name}</div>
                        {row.email && <div className="text-sm text-gray-500">{row.email}</div>}
                    </div>
                </div>
            ),
            width: 250
        },
        {
            key: 'customerType',
            title: 'Müşteri Tipi',
            sortable: true,
            render: (value) => value || '-',
            width: 120
        },
        {
            key: 'category',
            title: 'Kategori',
            sortable: true,
            render: (value) => value || '-',
            width: 100
        },
        {
            key: 'lifecycleStage',
            title: 'Yaşam Döngüsü',
            sortable: true,
            render: (value) => {
                const stageMap: Record<string, { label: string; color: string }> = {
                    lead: { label: "Lead", color: "#64748b" },
                    mql: { label: "MQL", color: "#0ea5e9" },
                    sql: { label: "SQL", color: "#6366f1" },
                    opportunity: { label: "Opportunity", color: "#f59e0b" },
                    customer: { label: "Customer", color: "#10b981" },
                };
                const stage = stageMap[value as string] || { label: value || "-", color: "#94a3b8" };
                return (
                    <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                            backgroundColor: `${stage.color}1a`, 
                            color: stage.color 
                        }}
                    >
                        {stage.label}
                    </span>
                );
            },
            width: 120
        },
        {
            key: 'sector',
            title: 'Sektör',
            sortable: true,
            render: (value) => value || '-',
            width: 120
        },
        {
            key: 'country',
            title: 'Ülke/Şehir',
            render: (value, row) => {
                const location = [row.country, row.city].filter(Boolean).join(', ');
                return location || '-';
            },
            width: 150
        },
        {
            key: 'phone',
            title: 'Telefon',
            render: (value) => value || '-',
            width: 140
        },
        {
            key: 'status',
            title: 'Durum',
            sortable: true,
            render: (value) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {value === 'active' ? 'Aktif' : 'Pasif'}
                </span>
            ),
            width: 100,
            align: 'center' as const
        },
        {
            key: 'tags',
            title: 'Etiketler',
            render: (value: string[]) => (
                <div className="flex flex-wrap gap-1">
                    {(value || []).slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {tag}
                        </span>
                    ))}
                    {(value || []).length > 2 && (
                        <span className="text-xs text-gray-500">+{(value || []).length - 2}</span>
                    )}
                </div>
            ),
            width: 150
        },
        {
            key: 'updatedAt',
            title: 'Son Güncelleme',
            sortable: true,
            render: (value) => {
                const date = new Date(value);
                return date.toLocaleDateString('tr-TR');
            },
            width: 120,
            align: 'center' as const
        }
    ];

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <div className="px-6 lg:px-10 py-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xl font-semibold text-slate-900">Müşteriler</div>
                        <div className="text-sm text-slate-500">
                            {viewMode === 'grid' ? 'Kart görünümünde grid liste' : 'Tablo görünümünde liste'}
                        </div>
                    </div>
                <div className="flex items-center gap-3">
                    <SettingsMenuButton screenId="customers" />
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <GridView className="h-4 w-4" />
                                Kart
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <TableChart className="h-4 w-4" />
                                Tablo
                            </button>
                        </div>
                        <div className="hidden md:flex items-center gap-3 text-sm text-slate-600">
                            <div className="rounded-xl border bg-white shadow-sm px-3 py-2">Toplam: {total}</div>
                        </div>
                    </div>
                </div>

                <div className="sticky top-4 z-10">
                    <CustomerFilters
                        q={q} sector={sector} tag={tag} status={status} sort={sort}
                        onChange={patch}
                        onClear={onClear}
                    />
                </div>

                {viewMode === 'grid' ? (
                    <>
                        <CustomerGrid items={items} loading={loading} />

                        <div className="flex items-center justify-between text-sm text-slate-600">
                            <div>Toplam: {total}</div>
                            <div className="flex items-center gap-2">
                                <button disabled={page <= 1} onClick={() => patch({ page: String(page - 1) })} className="h-9 px-3 rounded-md border">Geri</button>
                                <div>Sayfa {page}</div>
                                <button onClick={() => patch({ page: String(page + 1) })} className="h-9 px-3 rounded-md border">İleri</button>
                                <select value={pageSize} onChange={(e) => patch({ pageSize: e.target.value })} className="h-9 px-2 rounded-md border">
                                    <option value="10">10</option><option value="20">20</option><option value="50">50</option>
                                </select>
                            </div>
                        </div>
                    </>
                ) : (
                    <MuiCustomerGrid
                        customers={items}
                        loading={loading}
                        total={total}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={(newPage) => {
                            patch({ page: String(newPage) });
                        }}
                        onPageSizeChange={(newSize) => {
                            patch({ pageSize: String(newSize) });
                        }}
                        onRowClick={(customer) => navigate('/customers/edit', { state: { customerId: customer.id } })}
                    />
                )}
            </div>
            <Footer />
        </DashboardLayout>
    );
}

function normalizeCustomerFromDto(dto: any): Customer {
    const id = String(dto?.id ?? dto?.cusid ?? dto?.customerId ?? "");
    const name = String(dto?.name ?? dto?.custx ?? dto?.title ?? "");
    
    // Debug: Backend'den gelen status ve isActive değerlerini logla
    
    const firstAddress = Array.isArray(dto?.addresses) && dto.addresses.length ? dto.addresses[0] : undefined;
    const country = String(firstAddress?.country ?? dto?.country ?? "");
    const city = (firstAddress?.city ?? dto?.city) ? String(firstAddress?.city ?? dto?.city) : undefined;
    const website = (dto?.website ?? dto?.webSite) ? String(dto?.website ?? dto?.webSite) : undefined;
    // Email'i farklı kaynaklardan al (emails array'den de bakabilir)
    const primaryEmail = Array.isArray(dto?.emails) && dto.emails.length 
        ? dto.emails.find((e: any) => e.isPrimary)?.email || dto.emails[0]?.email
        : undefined;
    const email = (dto?.emailPrimary ?? dto?.email ?? primaryEmail) ? String(dto?.emailPrimary ?? dto?.email ?? primaryEmail) : undefined;
    const phone = (dto?.phone ?? dto?.mobile) ? String(dto?.phone ?? dto?.mobile) : undefined;
    // Status hesaplama: önce isActive boolean değerini kontrol et, sonra status string/number değerini
    const isActiveBoolean = dto?.isActive !== undefined ? !!dto.isActive : undefined;
    const statusString = (dto?.status === "active" || dto?.status === "inactive") ? dto.status : undefined;
    const statusNum = typeof dto?.status === "number" ? dto.status : undefined;
    
    let status: "active" | "inactive";
    if (isActiveBoolean !== undefined) {
        // isActive boolean değeri varsa onu kullan
        status = isActiveBoolean ? "active" : "inactive";
    } else if (statusString) {
        // status string değeri varsa onu kullan
        status = statusString;
    } else if (statusNum !== undefined) {
        // status number değeri varsa onu kullan (>0 = active)
        status = statusNum > 0 ? "active" : "inactive";
    } else {
        // Hiçbiri yoksa varsayılan olarak active
        status = "active";
    }
    const sectors = Array.isArray(dto?.sectors) ? dto.sectors : (dto?.sector ? [dto.sector] : []);
    const sector = sectors.length ? String(sectors[0]) : "";
    const tags = Array.isArray(dto?.tags) ? dto.tags as string[] : [];
    const nowIso = new Date().toISOString();
    const createdAt = String(dto?.createdDate ?? dto?.createdAt ?? nowIso);
    const updatedAt = String(dto?.updatedDate ?? dto?.updatedAt ?? createdAt);
    return {
        id,
        code: dto?.code || undefined,
        name,
        logoUrl: undefined,
        sector,
        country,
        city,
        website,
        email,
        phone,
        taxId: dto?.taxNumber ?? undefined,
        tags,
        status,
        health: "good",
        lastContactAt: updatedAt,
        kpis: { totalRevenue: 0, openOpportunities: 0, arRisk: 0 },
        notes: dto?.note ?? undefined,
        createdAt,
        updatedAt,
        // Lookup text alanları
        customerType: dto?.customerTypeText ?? dto?.customerTypeName ?? undefined,
        category: dto?.categoryText ?? dto?.categoryName ?? undefined,
        lifecycleStage: dto?.lifecycleStageText ?? dto?.lifecycleStageName ?? undefined,
    };
}
