import { FormDataApi } from "./generated";
import getConfiguration from "../confiuration";

export interface FormEnumItem {
  id: number;
  name: string;
  description?: string | null;
}

export async function listForms() {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataGet();
  return res.data || [];
}

export async function getFormById(id: string) {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataIdGet(id);
  return res.data as any;
}

export async function createForm(payload: any) {
  const api = new FormDataApi(getConfiguration());
  await api.apiFormDataPost(payload);
}

export async function updateForm(payload: any) {
  const api = new FormDataApi(getConfiguration());
  await api.apiFormDataPut(payload);
}

export async function createRevision(id: string) {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataCreateRevisionIdPost(id);
  return (res as any)?.data;
}

export async function publishForm(id: string) {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataPublishIdPost(id);
  return (res as any)?.data;
}

export async function getVersions(parentId: string) {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataAllVersionsParentIdGet(parentId);
  return res.data || [];
}

export async function getFormTypes(): Promise<FormEnumItem[]> {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataGetFormTypesEnumGet();
  return (res as any)?.data || [];
}

export async function getFormCategories(): Promise<FormEnumItem[]> {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataGetFormCategoriesEnumGet();
  return (res as any)?.data || [];
}

export async function getFormPriorities(): Promise<FormEnumItem[]> {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataGetFormPrioritiesEnumGet();
  return (res as any)?.data || [];
}

export async function getFormListByMenu() {
  const api = new FormDataApi(getConfiguration());
  const res = await api.apiFormDataGetFormListByMenuGet();
  return res.data || [];
}


