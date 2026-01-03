// src/api/departmentService.ts

export interface Department {
  id: string;
  name: string;
  code?: string;
  parentDepartmentId?: string;
  isActive: boolean;
}

const API_URL = "https://localhost:44363/api/Departments";

export const getDepartments = async (filter: { search?: string; isActive?: boolean | null } = {}) => {
  const params = new URLSearchParams();
  if (filter.search) params.append("search", filter.search);
  if (filter.isActive !== undefined && filter.isActive !== null) params.append("isActive", String(filter.isActive));
  const res = await fetch(`${API_URL}${params.toString() ? `?${params}` : ""}`);
  if (!res.ok) throw new Error("Departmanlar alınamadı");
  return res.json();
};

export const addDepartment = async (dep: Omit<Department, "id">) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dep),
  });
  if (!res.ok) throw new Error("Departman eklenemedi");
  return res.json();
};

export const updateDepartment = async (id: string, dep: Partial<Department>) => {
  const res = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...dep, id }),
  });
  if (!res.ok) throw new Error("Departman güncellenemedi");
  return res.json();
};

export const softDeleteDepartment = async (id: string) => {
  const res = await fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Departman silinemedi");
  return res.json();
};
