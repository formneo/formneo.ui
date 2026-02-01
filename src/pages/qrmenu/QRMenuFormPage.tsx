import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Grid,
    Card,
    TextField,
    Switch,
    FormControlLabel,
    MenuItem,
    Box,
    Tabs,
    Tab,
    Divider,
    Chip,
    IconButton,
    Typography
} from "@mui/material";
import {
    Save as SaveIcon,
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    ColorLens as ColorLensIcon,
    Preview as PreviewIcon
} from "@mui/icons-material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { MenuFormData, MenuTheme, MenuSettings, MenuCategory, MenuItem as MenuItemType } from "types/qrmenu";
import { useRegisterActions } from "context/ActionBarContext";
import CategoryManager from "components/qrmenu/CategoryManager";
import ItemManager from "components/qrmenu/ItemManager";
import QRCodeGenerator from "components/qrmenu/QRCodeGenerator";

const schema = z.object({
    name: z.string().min(2, "Menü adı en az 2 karakter olmalıdır"),
    description: z.string().optional(),
    customerId: z.string().min(1, "Müşteri seçimi zorunludur"),
    isActive: z.boolean(),
    theme: z.object({
        primaryColor: z.string(),
        secondaryColor: z.string(),
        backgroundColor: z.string(),
        textColor: z.string(),
        fontFamily: z.string(),
        logoUrl: z.string().optional(),
        backgroundImage: z.string().optional()
    }),
    settings: z.object({
        showPrices: z.boolean(),
        showImages: z.boolean(),
        showDescription: z.boolean(),
        showNutrition: z.boolean(),
        showAllergens: z.boolean(),
        showPreparationTime: z.boolean(),
        allowOrdering: z.boolean(),
        currency: z.string(),
        language: z.enum(["tr", "en"]),
        contactInfo: z.object({
            phone: z.string().optional(),
            email: z.string().email().optional().or(z.literal("")),
            address: z.string().optional(),
            website: z.string().url().optional().or(z.literal("")),
            socialMedia: z.object({
                instagram: z.string().optional(),
                facebook: z.string().optional(),
                twitter: z.string().optional()
            }).optional()
        }).optional()
    })
});

type FormValues = z.infer<typeof schema>;

const defaultTheme: MenuTheme = {
    primaryColor: "#2196F3",
    secondaryColor: "#FF9800",
    backgroundColor: "#FFFFFF",
    textColor: "#333333",
    fontFamily: "Roboto"
};

const defaultSettings: MenuSettings = {
    showPrices: true,
    showImages: true,
    showDescription: true,
    showNutrition: false,
    showAllergens: true,
    showPreparationTime: true,
    allowOrdering: false,
    currency: "TRY",
    language: "tr"
};

const fontFamilies = [
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Nunito",
    "Source Sans Pro",
    "Ubuntu"
];

const currencies = [
    { value: "TRY", label: "₺ Türk Lirası" },
    { value: "USD", label: "$ Amerikan Doları" },
    { value: "EUR", label: "€ Euro" },
    { value: "GBP", label: "£ İngiliz Sterlini" }
];

export default function QRMenuFormPage(): JSX.Element {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [items, setItems] = useState<MenuItemType[]>([]);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [menuUrl, setMenuUrl] = useState<string>("");

    const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            description: "",
            customerId: "",
            isActive: true,
            theme: defaultTheme,
            settings: defaultSettings
        }
    });

    const watchedTheme = watch("theme");
    const watchedSettings = watch("settings");

    // Action bar
    useRegisterActions([
        {
            id: "cancel",
            label: "İptal",
            icon: <CloseIcon fontSize="small" />,
            onClick: () => navigate("/qrmenu")
        },
        {
            id: "preview",
            label: "Önizle",
            icon: <PreviewIcon fontSize="small" />,
            onClick: () => {
                // Önizleme fonksiyonu
                
            }
        },
        {
            id: "save",
            label: isEdit ? "Güncelle" : "Kaydet",
            icon: <SaveIcon fontSize="small" />,
            onClick: () => handleSubmit(onSubmit)(),
            disabled: isSubmitting
        }
    ], [isEdit, isSubmitting]);

    useEffect(() => {
        if (isEdit && id) {
            // Gerçek uygulamada API'den veri yüklenecek
            // loadMenuData(id);
        }
    }, [isEdit, id]);

    const onSubmit = async (data: FormValues) => {
        try {
            
            // Gerçek uygulamada API çağrısı yapılacak
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simülasyon
            navigate("/qrmenu");
        } catch (error) {
            console.error("Kaydetme hatası:", error);
        }
    };

    const handleColorChange = (field: string, color: { hex: string }) => {
        setValue(`theme.${field}` as any, color.hex);
    };

    const ColorPicker = ({ field, label, value }: { field: string; label: string; value: string }) => (
        <MDBox>
            <MDTypography variant="caption" fontWeight="medium" mb={1}>
                {label}
            </MDTypography>
            <MDBox display="flex" alignItems="center" gap={1}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: value,
                        border: "1px solid #ddd",
                        borderRadius: 1,
                        cursor: "pointer"
                    }}
                    onClick={() => setColorPickerOpen(colorPickerOpen === field ? null : field)}
                />
                <TextField
                    size="small"
                    value={value}
                    onChange={(e) => setValue(`theme.${field}` as any, e.target.value)}
                    sx={{ flexGrow: 1 }}
                />
            </MDBox>
            {colorPickerOpen === field && (
                <MDBox mt={1} position="relative">
                    {/* ChromePicker component will be added when react-color types are available */}
                    <Typography variant="caption" color="text.secondary">
                        Renk seçici yakında eklenecek
                    </Typography>
                </MDBox>
            )}
        </MDBox>
    );

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <MDBox mb={3}>
                    <MDTypography variant="h4" fontWeight="medium">
                        {isEdit ? "Menüyü Düzenle" : "Yeni Menü Oluştur"}
                    </MDTypography>
                </MDBox>

                <Card>
                    <MDBox p={3}>
                        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                            <Tab label="Genel Bilgiler" />
                            <Tab label="Kategoriler" />
                            <Tab label="Ürünler" />
                            <Tab label="Tema & Görünüm" />
                            <Tab label="Ayarlar" />
                            <Tab label="İletişim Bilgileri" />
                            <Tab label="QR Kod" />
                        </Tabs>

                        <MDBox mt={3}>
                            {/* Genel Bilgiler Tab */}
                            {activeTab === 0 && (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Controller
                                            name="name"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Menü Adı *"
                                                    error={!!errors.name}
                                                    helperText={errors.name?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Controller
                                            name="customerId"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    fullWidth
                                                    label="Müşteri *"
                                                    error={!!errors.customerId}
                                                    helperText={errors.customerId?.message}
                                                >
                                                    <MenuItem value="customer-1">Restoran XYZ</MenuItem>
                                                    <MenuItem value="customer-2">Kafe ABC</MenuItem>
                                                    <MenuItem value="customer-3">Otel DEF</MenuItem>
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Controller
                                            name="description"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    label="Açıklama"
                                                    placeholder="Menü hakkında kısa bir açıklama yazın..."
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Controller
                                            name="isActive"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch {...field} checked={field.value} />}
                                                    label="Menü aktif"
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            {/* Kategoriler Tab */}
                            {activeTab === 1 && (
                                <CategoryManager
                                    menuId={id || "new"}
                                    categories={categories}
                                    onCategoriesChange={setCategories}
                                />
                            )}

                            {/* Ürünler Tab */}
                            {activeTab === 2 && (
                                <ItemManager
                                    menuId={id || "new"}
                                    categories={categories}
                                    items={items}
                                    onItemsChange={setItems}
                                />
                            )}

                            {/* Tema & Görünüm Tab */}
                            {activeTab === 3 && (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <MDBox mb={3}>
                                            <ColorPicker
                                                field="primaryColor"
                                                label="Ana Renk"
                                                value={watchedTheme.primaryColor}
                                            />
                                        </MDBox>
                                        <MDBox mb={3}>
                                            <ColorPicker
                                                field="secondaryColor"
                                                label="İkincil Renk"
                                                value={watchedTheme.secondaryColor}
                                            />
                                        </MDBox>
                                        <MDBox mb={3}>
                                            <ColorPicker
                                                field="backgroundColor"
                                                label="Arka Plan Rengi"
                                                value={watchedTheme.backgroundColor}
                                            />
                                        </MDBox>
                                        <MDBox mb={3}>
                                            <ColorPicker
                                                field="textColor"
                                                label="Metin Rengi"
                                                value={watchedTheme.textColor}
                                            />
                                        </MDBox>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Controller
                                            name="theme.fontFamily"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    fullWidth
                                                    label="Font Ailesi"
                                                    sx={{ mb: 3 }}
                                                >
                                                    {fontFamilies.map((font) => (
                                                        <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                                                            {font}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                        <Controller
                                            name="theme.logoUrl"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Logo URL"
                                                    placeholder="https://example.com/logo.png"
                                                    sx={{ mb: 3 }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="theme.backgroundImage"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Arka Plan Resmi URL"
                                                    placeholder="https://example.com/background.jpg"
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            {/* Ayarlar Tab */}
                            {activeTab === 4 && (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <MDTypography variant="h6" mb={2}>Görünüm Ayarları</MDTypography>
                                        <MDBox display="flex" flexDirection="column" gap={1}>
                                            <Controller
                                                name="settings.showPrices"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch {...field} checked={field.value} />}
                                                        label="Fiyatları göster"
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="settings.showImages"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch {...field} checked={field.value} />}
                                                        label="Resimleri göster"
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="settings.showDescription"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch {...field} checked={field.value} />}
                                                        label="Açıklamaları göster"
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="settings.showNutrition"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch {...field} checked={field.value} />}
                                                        label="Besin değerlerini göster"
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="settings.showAllergens"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch {...field} checked={field.value} />}
                                                        label="Alerjenleri göster"
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="settings.showPreparationTime"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch {...field} checked={field.value} />}
                                                        label="Hazırlık süresini göster"
                                                    />
                                                )}
                                            />
                                        </MDBox>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <MDTypography variant="h6" mb={2}>Genel Ayarlar</MDTypography>
                                        <MDBox display="flex" flexDirection="column" gap={2}>
                                            <Controller
                                                name="settings.allowOrdering"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch {...field} checked={field.value} />}
                                                        label="Sipariş vermeye izin ver"
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="settings.currency"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        select
                                                        fullWidth
                                                        label="Para Birimi"
                                                    >
                                                        {currencies.map((currency) => (
                                                            <MenuItem key={currency.value} value={currency.value}>
                                                                {currency.label}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                )}
                                            />
                                            <Controller
                                                name="settings.language"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        select
                                                        fullWidth
                                                        label="Dil"
                                                    >
                                                        <MenuItem value="tr">Türkçe</MenuItem>
                                                        <MenuItem value="en">English</MenuItem>
                                                    </TextField>
                                                )}
                                            />
                                        </MDBox>
                                    </Grid>
                                </Grid>
                            )}

                            {/* İletişim Bilgileri Tab */}
                            {activeTab === 5 && (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Controller
                                            name="settings.contactInfo.phone"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Telefon"
                                                    placeholder="+90 555 123 45 67"
                                                    sx={{ mb: 2 }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="settings.contactInfo.email"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="E-posta"
                                                    placeholder="info@example.com"
                                                    sx={{ mb: 2 }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="settings.contactInfo.website"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Web Sitesi"
                                                    placeholder="https://www.example.com"
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Controller
                                            name="settings.contactInfo.address"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    label="Adres"
                                                    placeholder="Tam adres bilgisi..."
                                                    sx={{ mb: 2 }}
                                                />
                                            )}
                                        />
                                        <MDTypography variant="h6" mb={1}>Sosyal Medya</MDTypography>
                                        <Controller
                                            name="settings.contactInfo.socialMedia.instagram"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Instagram"
                                                    placeholder="@kullanici_adi"
                                                    sx={{ mb: 1 }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="settings.contactInfo.socialMedia.facebook"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Facebook"
                                                    placeholder="facebook.com/sayfa"
                                                    sx={{ mb: 1 }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="settings.contactInfo.socialMedia.twitter"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Twitter"
                                                    placeholder="@kullanici_adi"
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            {/* QR Kod Tab */}
                            {activeTab === 6 && (
                                <QRCodeGenerator
                                    menuId={id || "new"}
                                    menuName={watch("name") || "Yeni Menü"}
                                    onQRGenerated={(qrUrl, menuUrl) => {
                                        setQrCodeUrl(qrUrl);
                                        setMenuUrl(menuUrl);
                                    }}
                                />
                            )}
                        </MDBox>
                    </MDBox>
                </Card>
            </MDBox>
            <Footer />
        </DashboardLayout>
    );
}
