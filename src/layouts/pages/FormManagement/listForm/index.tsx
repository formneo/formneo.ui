/**
 * BPM Form Revizyon ve Versiyon Yönetimi - Liste Ekranı
 * API: FormDataApi.apiFormDataGroupsGet, FormDataApi.apiFormDataAllVersionsParentIdGet
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Add from "@mui/icons-material/Add";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Description from "@mui/icons-material/Description";
import Edit from "@mui/icons-material/Edit";
import Check from "@mui/icons-material/Check";
import Archive from "@mui/icons-material/Archive";
import Visibility from "@mui/icons-material/Visibility";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";
import type { FormGroupDto, FormDataListDto } from "api/generated";

type Status = "draft" | "published" | "archived";

const STATUS_LABELS: Record<Status, string> = {
  draft: "Taslak",
  published: "Yayında",
  archived: "Arşivlendi",
};

function toStatus(dto: FormDataListDto): Status {
  const text = (dto.publicationStatusText ?? "").toLowerCase();
  if (text.includes("taslak") || dto.publicationStatus === 1) return "draft";
  if (text.includes("yayın") || dto.publicationStatus === 2) return "published";
  return "archived";
}

function StatusBadge({
  status,
  size = "default",
}: {
  status: Status;
  size?: "default" | "sm";
}) {
  const base = "inline-flex items-center gap-1 rounded-full font-medium";
  const sz = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  const iconSx = { fontSize: size === "sm" ? 14 : 16 };
  if (status === "draft") {
    return (
      <span className={`${base} ${sz} bg-amber-100 text-amber-800`}>
        <Edit sx={iconSx} />
        {STATUS_LABELS.draft}
      </span>
    );
  }
  if (status === "published") {
    return (
      <span className={`${base} ${sz} bg-emerald-100 text-emerald-800`}>
        <Check sx={iconSx} />
        {STATUS_LABELS.published}
      </span>
    );
  }
  return (
    <span className={`${base} ${sz} bg-slate-100 text-slate-600`}>
      <Archive sx={iconSx} />
      {STATUS_LABELS.archived}
    </span>
  );
}

const FORM_DESIGNER_PATH = "/forms/designer";

export default function FormRevisionManagement() {
  const navigate = useNavigate();
  const api = useMemo(() => new FormDataApi(getConfiguration()), []);
  const [groups, setGroups] = useState<FormGroupDto[]>([]);
  const [versionsByParentId, setVersionsByParentId] = useState<Record<string, FormDataListDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Designer (antd) sonrası dönünce yazı küçülmesin: root font-size sabitle, çıkınca eski değere dön
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlFs = html.style.fontSize;
    const prevBodyFs = body.style.fontSize;
    html.style.fontSize = "16px";
    body.style.fontSize = "16px";
    return () => {
      html.style.fontSize = prevHtmlFs;
      body.style.fontSize = prevBodyFs;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .apiFormDataGroupsGet()
      .then((res) => {
        if (!cancelled) setGroups(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Form grupları yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const loadVersions = useCallback(
    (parentId: string) => {
      if (versionsByParentId[parentId] != null) return;
      setLoadingVersions((prev) => new Set(prev).add(parentId));
      api
        .apiFormDataAllVersionsParentIdGet(parentId)
        .then((res) => {
          setVersionsByParentId((prev) => ({
            ...prev,
            [parentId]: res.data ?? [],
          }));
        })
        .finally(() => {
          setLoadingVersions((prev) => {
            const next = new Set(prev);
            next.delete(parentId);
            return next;
          });
        });
    },
    [api, versionsByParentId]
  );

  const toggleExpand = (group: FormGroupDto) => {
    const id = group.id ?? group.parentFormId ?? "";
    const parentId = group.parentFormId ?? group.id ?? "";
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        if (parentId) loadVersions(parentId);
      }
      return next;
    });
  };

  const goToDesigner = (formId: string, group?: FormGroupDto, rev?: FormDataListDto) => {
    navigate(formId ? `${FORM_DESIGNER_PATH}/${formId}` : FORM_DESIGNER_PATH, {
      state: group && rev ? { group, revision: rev } : undefined,
    });
  };

  const formatDate = (s: string | undefined) => {
    if (!s) return "—";
    try {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("tr-TR");
    } catch {
      return s;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-full overflow-x-hidden">
        <DashboardNavbar />
        <div className="bg-slate-50 p-6">
        {/* Başlık alanı */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Form Revizyon ve Versiyon Yönetimi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Formları ve revizyonlarını yönetin; taslak, yayın ve arşiv durumlarını takip edin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => goToDesigner("")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Add sx={{ fontSize: 20 }} />
            Yeni Form Oluştur
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-500">
            Yükleniyor…
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {groups.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500">Henüz form grubu yok.</div>
            ) : (
              groups.map((group) => {
                const id = group.id ?? group.parentFormId ?? "";
                const parentId = group.parentFormId ?? group.id ?? "";
                const isExpanded = expandedIds.has(id);
                const versions = parentId ? versionsByParentId[parentId] : undefined;
                const loadingV = parentId ? loadingVersions.has(parentId) : false;
                return (
                  <div key={id} className="border-b border-slate-100 last:border-b-0">
                    <div
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => toggleExpand(group)}
                    >
                      <button
                        type="button"
                        className="p-0.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                        aria-label={isExpanded ? "Kapat" : "Aç"}
                      >
                        {isExpanded ? (
                          <ExpandMore sx={{ fontSize: 20 }} />
                        ) : (
                          <ChevronRight sx={{ fontSize: 20 }} />
                        )}
                      </button>
                      <span className="font-mono text-sm font-medium text-slate-700 w-24">
                        {group.formCode ?? "—"}
                      </span>
                      <span className="inline-flex items-center gap-2 text-slate-800 font-medium flex-1">
                        <Description sx={{ fontSize: 18, color: "rgb(148 163 184)" }} />
                        {group.formName ?? "—"}
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        v{group.latestRevision ?? "—"}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="bg-slate-50/50 border-t border-slate-100">
                        {loadingV ? (
                          <div className="pl-14 pr-5 py-4 text-sm text-slate-500">
                            Versiyonlar yükleniyor…
                          </div>
                        ) : versions && versions.length > 0 ? (
                          versions.map((rev) => {
                            const status = toStatus(rev);
                            return (
                              <div
                                key={rev.id ?? rev.revision}
                                className="flex items-center gap-4 pl-14 pr-5 py-3 border-b border-slate-100 last:border-b-0 hover:bg-white/80"
                              >
                                <span className="font-mono text-sm text-slate-600 w-12">
                                  v{rev.revision ?? "—"}
                                </span>
                                <StatusBadge status={status} size="sm" />
                                <span className="text-sm text-slate-500">
                                  {formatDate(rev.createdDate)}
                                </span>
                                <div className="ml-auto flex items-center gap-2">
                                  {status === "draft" ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        goToDesigner(rev.id ?? "", group, rev);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
                                    >
                                      <Edit sx={{ fontSize: 14 }} />
                                      Düzenle
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        goToDesigner(rev.id ?? "", group, rev);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                                    >
                                      <Visibility sx={{ fontSize: 14 }} />
                                      Görüntüle
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="pl-14 pr-5 py-3 text-sm text-slate-500">
                            Versiyon bulunamadı.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}
