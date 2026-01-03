// src/api/positionService.ts

export interface Position {
  id: string;
  name: string;
  code?: string;
  departmentId?: string;
  isActive: boolean;
}

const API_URL = "https://localhost:44363/api/Positions";

export const getPositions = async (filter: { search?: string; departmentId?: string; isActive?: boolean | null } = {}) => {
  const params = new URLSearchParams();
  if (filter.search) params.append("search", filter.search);
  if (filter.departmentId) params.append("departmentId", filter.departmentId);
  if (filter.isActive !== undefined && filter.isActive !== null) params.append("isActive", String(filter.isActive));
  const res = await fetch(`${API_URL}${params.toString() ? `?${params}` : ""}`);
  if (!res.ok) throw new Error("Pozisyonlar alınamadı");
  return res.json();
};

export const addPosition = async (pos: Omit<Position, "id">) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pos),
  });
  if (!res.ok) throw new Error("Pozisyon eklenemedi");
  return res.json();
};

export const updatePosition = async (id: string, pos: Partial<Position>) => {
  const res = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...pos, id }),
  });
  if (!res.ok) throw new Error("Pozisyon güncellenemedi");
  return res.json();
};

export const softDeletePosition = async (id: string) => {
  const res = await fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Pozisyon silinemedi");
  return res.json();
};
