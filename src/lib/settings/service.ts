import { SettingsBundle, SettingsCategory, SettingsParameter, SettingsScope } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let mockCategories: SettingsCategory[] = [
    { id: "general", name: "Genel", description: "Genel uygulama ayarları", orderNo: 1 },
    { id: "crm", name: "CRM", description: "Müşteri ve satış parametreleri", orderNo: 2 },
    { id: "email", name: "E-posta", description: "SMTP ve bildirimler", orderNo: 3 },
];

let mockParameters: SettingsParameter[] = [
    {
        id: "locale", categoryId: "general", name: "Varsayılan Dil", type: "select", options: [
            { value: "tr", label: "Türkçe" }, { value: "en", label: "English" }
        ], defaultValue: "tr", orderNo: 1
    },
    { id: "feature-advanced", categoryId: "general", name: "Gelişmiş Özellikler", type: "boolean", defaultValue: false, orderNo: 2 },
    {
        id: "customer-types", categoryId: "crm", name: "Müşteri Tipleri", type: "multiselect", options: [
            { value: "gold", label: "Gold" }, { value: "silver", label: "Silver" }, { value: "standard", label: "Standart" }
        ], orderNo: 1
    },
    { id: "max-attachments", categoryId: "crm", name: "Maksimum Ek Boyutu (MB)", type: "number", defaultValue: 25, orderNo: 2 },
    { id: "smtp-host", categoryId: "email", name: "SMTP Host", type: "string", defaultValue: "smtp.example.com", orderNo: 1 },
    { id: "smtp-secure", categoryId: "email", name: "TLS Zorunlu", type: "boolean", defaultValue: true, orderNo: 2 },
];

export async function listCategories(): Promise<SettingsCategory[]> {
    await delay(200);
    return [...mockCategories].sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));
}

export async function getCategoryBundle(categoryId: string, scope: SettingsScope): Promise<SettingsBundle> {
    await delay(300);
    const category = mockCategories.find((c) => c.id === categoryId) || mockCategories[0];
    const parameters = mockParameters.filter((p) => p.categoryId === category.id).sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));
    const values = Object.fromEntries(parameters.map((p) => [p.id, { parameterId: p.id, scope, value: p.defaultValue }]));
    return { category, parameters, values };
}

export async function saveValues(categoryId: string, scope: SettingsScope, data: Record<string, unknown>): Promise<void> {
    await delay(300);
    
}


// Admin CRUD (Mock, in-memory)
export async function listParameters(categoryId?: string): Promise<SettingsParameter[]> {
    await delay(150);
    const items = categoryId ? mockParameters.filter(p => p.categoryId === categoryId) : mockParameters;
    return [...items].sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));
}

export async function createCategory(input: Omit<SettingsCategory, "orderNo"> & { orderNo?: number }): Promise<SettingsCategory> {
    await delay(200);
    if (mockCategories.some(c => c.id === input.id)) throw new Error("Category id already exists");
    const cat: SettingsCategory = { ...input, orderNo: input.orderNo ?? mockCategories.length + 1 };
    mockCategories = [...mockCategories, cat];
    return cat;
}

export async function updateCategory(id: string, changes: Partial<SettingsCategory>): Promise<SettingsCategory> {
    await delay(200);
    const idx = mockCategories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    mockCategories[idx] = { ...mockCategories[idx], ...changes };
    return mockCategories[idx];
}

export async function deleteCategory(id: string): Promise<void> {
    await delay(200);
    mockCategories = mockCategories.filter(c => c.id !== id);
    mockParameters = mockParameters.filter(p => p.categoryId !== id);
}

export async function createParameter(input: SettingsParameter): Promise<SettingsParameter> {
    await delay(250);
    if (mockParameters.some(p => p.id === input.id)) throw new Error("Parameter id already exists");
    mockParameters = [...mockParameters, input];
    return input;
}

export async function updateParameter(id: string, changes: Partial<SettingsParameter>): Promise<SettingsParameter> {
    await delay(250);
    const idx = mockParameters.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Parameter not found");
    mockParameters[idx] = { ...mockParameters[idx], ...changes };
    return mockParameters[idx];
}

export async function deleteParameter(id: string): Promise<void> {
    await delay(200);
    mockParameters = mockParameters.filter(p => p.id !== id);
}


