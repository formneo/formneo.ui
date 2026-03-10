import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Send as SendIcon,
  Lightbulb as IdeaIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  Visibility as PreviewIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

interface AIAssistantProps {
  onFormGenerated: (schema: any, entities: any[]) => void;
}

const FORM_CATEGORIES = {
  business: {
    title: "İş Süreçleri",
    icon: "💼",
    templates: [
      {
        title: "Müşteri Kayıt Formu",
        prompt: "Müşteri kayıt formu oluştur. Ad, soyad, email (zorunlu), telefon, şirket, adres bilgileri. Email validasyonu ve telefon formatı kontrollü olsun.",
        tags: ["CRM", "Müşteri", "Kayıt"],
        complexity: "Basit"
      },
      {
        title: "Personel İşe Alım Formu",
        prompt: "İnsan kaynakları için personel işe alım formu. Kişisel bilgiler, eğitim geçmişi, iş deneyimi, referanslar, maaş beklentisi. CV yükleme alanı da olsun.",
        tags: ["İK", "İşe Alım", "CV"],
        complexity: "Orta"
      },
      {
        title: "Seyahat Talep Formu",
        prompt: "İş seyahati talep formu. Çalışan bilgileri, varış yeri, gidiş-dönüş tarihleri, konaklama tercihi, ulaşım şekli, tahmini bütçe, seyahat amacı. Onay akışı ile.",
        tags: ["Seyahat", "Onay", "Bütçe"],
        complexity: "Karmaşık"
      },
      {
        title: "Proje Başvuru Formu",
        prompt: "Yeni proje başvuru formu. Proje adı, açıklama, hedefler, timeline, bütçe, ekip üyeleri, risk analizi. Dosya ekleme ve çoklu onay süreçli.",
        tags: ["Proje", "Başvuru", "Onay"],
        complexity: "Karmaşık"
      }
    ]
  },
  finance: {
    title: "Finans & Muhasebe",
    icon: "💰",
    templates: [
      {
        title: "Fatura Formu",
        prompt: "Fatura oluşturma formu. Müşteri seçimi (dropdown), ürün/hizmet listesi (dinamik tablo), birim fiyat, miktar, KDV hesaplama, toplam tutar otomatik hesaplansın.",
        tags: ["Fatura", "Hesaplama", "KDV"],
        complexity: "Orta"
      },
      {
        title: "Gider Raporu",
        prompt: "Çalışan gider raporu formu. Tarih, kategori, tutar, açıklama, fiş/fatura yükleme. Toplam hesaplama ve onay akışı bulunsun.",
        tags: ["Gider", "Rapor", "Onay"],
        complexity: "Orta"
      },
      {
        title: "Bütçe Talebi",
        prompt: "Departman bütçe talep formu. Departman, dönem, talep edilen miktar, gerekçe, detaylı açıklama, öncelik seviyesi. Çoklu onay akışlı.",
        tags: ["Bütçe", "Talep", "Departman"],
        complexity: "Karmaşık"
      }
    ]
  },
  survey: {
    title: "Anket & Değerlendirme",
    icon: "📊",
    templates: [
      {
        title: "Müşteri Memnuniyet Anketi",
        prompt: "Müşteri memnuniyet anketi. Hizmet kalitesi (1-5 yıldız), hız değerlendirmesi, personel davranışı, genel memnuniyet, öneriler için açık alan.",
        tags: ["Anket", "Memnuniyet", "Değerlendirme"],
        complexity: "Basit"
      },
      {
        title: "Çalışan Performans Değerlendirme",
        prompt: "360 derece performans değerlendirme formu. Teknik yetkinlikler, iletişim becerileri, takım çalışması, liderlik, hedef başarısı. Puanlama sistemi ile.",
        tags: ["Performans", "Değerlendirme", "İK"],
        complexity: "Karmaşık"
      },
      {
        title: "Etkinlik Geri Bildirim",
        prompt: "Etkinlik değerlendirme formu. Etkinlik adı, tarih, organizasyon kalitesi, içerik değerlendirmesi, konuşmacı puanları, öneriler.",
        tags: ["Etkinlik", "Geri Bildirim", "Değerlendirme"],
        complexity: "Basit"
      }
    ]
  },
  technical: {
    title: "Teknik & IT",
    icon: "⚙️",
    templates: [
      {
        title: "IT Destek Talebi",
        prompt: "IT destek talep formu. Talep türü (donanım/yazılım), öncelik seviyesi, detaylı problem açıklaması, ekran görüntüsü yükleme, kullanıcı bilgileri.",
        tags: ["IT", "Destek", "Talep"],
        complexity: "Orta"
      },
      {
        title: "Sistem Erişim Talebi",
        prompt: "Yeni sistem erişim talep formu. Kullanıcı bilgileri, talep edilen sistem, erişim seviyesi, gerekçe, yönetici onayı, güvenlik kontrolleri.",
        tags: ["Erişim", "Güvenlik", "Onay"],
        complexity: "Karmaşık"
      },
      {
        title: "Bug Raporu",
        prompt: "Yazılım hata raporu formu. Hata türü, öncelik, adımlar, beklenen sonuç, gerçekleşen sonuç, sistem bilgileri, ekran görüntüsü.",
        tags: ["Bug", "Rapor", "Yazılım"],
        complexity: "Orta"
      }
    ]
  }
};

const AI_SETTINGS = {
  creativity: { min: 0, max: 100, default: 70, label: "Yaratıcılık" },
  complexity: { options: ["Basit", "Orta", "Karmaşık"], default: "Orta", label: "Karmaşıklık" },
  language: { options: ["Türkçe", "İngilizce"], default: "Türkçe", label: "Dil" },
  includeValidation: { default: true, label: "Validasyon Kuralları" },
  includeWorkflow: { default: false, label: "Onay Akışı" },
  responsiveDesign: { default: true, label: "Responsive Tasarım" }
};

export default function AIAssistant({ onFormGenerated }: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    creativity: AI_SETTINGS.creativity.default,
    complexity: AI_SETTINGS.complexity.default,
    language: AI_SETTINGS.language.default,
    includeValidation: AI_SETTINGS.includeValidation.default,
    includeWorkflow: AI_SETTINGS.includeWorkflow.default,
    responsiveDesign: AI_SETTINGS.responsiveDesign.default,
  });
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Lütfen bir açıklama girin");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    // Prompt history'ye ekle
    if (!promptHistory.includes(prompt)) {
      setPromptHistory(prev => [prompt, ...prev.slice(0, 4)]);
    }

    try {
      // TODO: Gerçek AI API'si buraya bağlanacak
      // AI settings'i de gönder
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResult = generateMockForm(prompt, aiSettings);
      setResult(mockResult);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onFormGenerated(result.formSchema, result.entities);
      setPrompt("");
      setResult(null);
    }
  };

  const handleTemplateClick = (template: any) => {
    setPrompt(template.prompt);
    // Template'in complexity'sine göre AI settings'i ayarla
    if (template.complexity === "Basit") {
      setAiSettings(prev => ({ ...prev, complexity: "Basit" }));
    } else if (template.complexity === "Karmaşık") {
      setAiSettings(prev => ({ ...prev, complexity: "Karmaşık", includeWorkflow: true }));
    }
  };

  const handleClearPrompt = () => {
    setPrompt("");
    setResult(null);
    setError("");
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  const toggleFavorite = (templateTitle: string) => {
    setFavoriteTemplates(prev => 
      prev.includes(templateTitle) 
        ? prev.filter(t => t !== templateTitle)
        : [...prev, templateTitle]
    );
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#fafafa" }}>
      {/* Enhanced Header */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          background: "linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PsychologyIcon />
          <Typography variant="subtitle2" fontWeight={600}>
            AI Form Designer
          </Typography>
          <Chip 
            label="Pro" 
            size="small" 
            sx={{ 
              height: 18, 
              fontSize: "0.65rem", 
              bgcolor: "rgba(255,255,255,0.2)", 
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)"
            }} 
          />
        </Box>
        <Tooltip title="Gelişmiş Ayarlar">
          <IconButton 
            size="small" 
            sx={{ color: "white" }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon="🚀" label="Hızlı Başlat" />
            <Tab icon="📝" label="Özel Prompt" />
            <Tab icon="📚" label="Şablonlar" />
            <Tab icon="🕒" label="Geçmiş" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {/* Quick Start Tab */}
          {activeTab === 0 && (
            <Box>
              <Alert severity="info" icon={<TrendingUpIcon />} sx={{ mb: 2, fontSize: "0.8rem" }}>
                <strong>Hızlı Başlangıç:</strong> Popüler form türlerinden birini seçin veya kendi promptunuzu yazın!
              </Alert>

              {/* Quick Actions */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(FORM_CATEGORIES).slice(0, 2).map(([key, category]) => (
                  <Grid item xs={6} key={key}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setActiveTab(2)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" sx={{ mb: 1 }}>{category.icon}</Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {category.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Quick Prompt */}
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    ⚡ Hızlı Form Oluştur
                  </Typography>
                  {prompt && (
                    <Tooltip title="Temizle">
                      <IconButton size="small" onClick={handleClearPrompt}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                
                <TextField
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  placeholder="Örn: Çalışan bilgi formu oluştur. Ad, soyad, departman, pozisyon, maaş bilgileri olsun..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AIIcon />}
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    sx={{
                      flex: 1,
                      background: "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
                      textTransform: "none",
                    }}
                  >
                    {loading ? "Oluşturuluyor..." : "✨ AI ile Oluştur"}
                  </Button>
                  {prompt && (
                    <Tooltip title="Kopyala">
                      <IconButton onClick={handleCopyPrompt}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            </Box>
          )}

          {/* Custom Prompt Tab */}
          {activeTab === 1 && (
            <Box>
              <Alert severity="success" icon={<CodeIcon />} sx={{ mb: 2, fontSize: "0.8rem" }}>
                <strong>Gelişmiş Prompt:</strong> Detaylı açıklamalar yapın, AI daha iyi sonuç verir!
              </Alert>

              {/* Advanced Settings */}
              {showAdvanced && (
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">⚙️ AI Ayarları</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" gutterBottom>
                          Yaratıcılık Seviyesi: {aiSettings.creativity}%
                        </Typography>
                        <Slider
                          value={aiSettings.creativity}
                          onChange={(e, value) => setAiSettings(prev => ({ ...prev, creativity: value as number }))}
                          valueLabelDisplay="auto"
                          min={0}
                          max={100}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Karmaşıklık</InputLabel>
                          <Select
                            value={aiSettings.complexity}
                            label="Karmaşıklık"
                            onChange={(e) => setAiSettings(prev => ({ ...prev, complexity: e.target.value }))}
                          >
                            {AI_SETTINGS.complexity.options.map(option => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Dil</InputLabel>
                          <Select
                            value={aiSettings.language}
                            label="Dil"
                            onChange={(e) => setAiSettings(prev => ({ ...prev, language: e.target.value }))}
                          >
                            {AI_SETTINGS.language.options.map(option => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={aiSettings.includeValidation}
                              onChange={(e) => setAiSettings(prev => ({ ...prev, includeValidation: e.target.checked }))}
                              size="small"
                            />
                          }
                          label="Validasyon Kuralları Ekle"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={aiSettings.includeWorkflow}
                              onChange={(e) => setAiSettings(prev => ({ ...prev, includeWorkflow: e.target.checked }))}
                              size="small"
                            />
                          }
                          label="Onay Akışı Dahil Et"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Enhanced Prompt Input */}
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    📝 Detaylı Form Açıklaması
                  </Typography>
                  <Tooltip title="Yardım">
                    <IconButton size="small">
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  size="small"
                  placeholder={`Detaylı form açıklaması yazın. Örnek:

"Personel işe alım formu oluştur:
- Kişisel bilgiler: Ad, soyad, TC kimlik, doğum tarihi
- İletişim: Email (zorunlu), telefon, adres
- Eğitim: Okul, bölüm, mezuniyet yılı
- Deneyim: Önceki işler, referanslar
- CV yükleme alanı
- Maaş beklentisi (gizli alan)
- Onay akışı: İK -> Departman Müdürü -> Genel Müdür"`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  sx={{
                    background: "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
                    textTransform: "none",
                    py: 1.5,
                  }}
                >
                  {loading ? "AI Çalışıyor..." : "🚀 Gelişmiş Form Oluştur"}
                </Button>
              </Paper>
            </Box>
          )}

          {/* Templates Tab */}
          {activeTab === 2 && (
            <Box>
              {Object.entries(FORM_CATEGORIES).map(([key, category]) => (
                <Accordion key={key} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{category.icon}</Typography>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {category.title}
                      </Typography>
                      <Chip label={category.templates.length} size="small" />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {category.templates.map((template, index) => (
                        <Grid item xs={12} key={index}>
                          <Card 
                            variant="outlined"
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { borderColor: '#9c27b0', boxShadow: 1 },
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleTemplateClick(template)}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {template.title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Chip 
                                    label={template.complexity} 
                                    size="small" 
                                    color={template.complexity === 'Basit' ? 'success' : template.complexity === 'Orta' ? 'warning' : 'error'}
                                  />
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(template.title);
                                    }}
                                  >
                                    <StarIcon 
                                      fontSize="small" 
                                      color={favoriteTemplates.includes(template.title) ? 'warning' : 'disabled'}
                                    />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                {template.prompt.substring(0, 100)}...
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {template.tags.map(tag => (
                                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* History Tab */}
          {activeTab === 3 && (
            <Box>
              {promptHistory.length === 0 ? (
                <Alert severity="info">
                  Henüz prompt geçmişiniz yok. Form oluşturdukça burada görünecek.
                </Alert>
              ) : (
                <List>
                  {promptHistory.map((historyPrompt, index) => (
                    <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        onClick={() => setPrompt(historyPrompt)}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          '&:hover': { borderColor: '#9c27b0' }
                        }}
                      >
                        <ListItemText
                          primary={`Prompt #${index + 1}`}
                          secondary={historyPrompt.substring(0, 100) + '...'}
                          primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Result Preview */}
          {result && (
            <Paper sx={{ p: 2, mt: 2, border: '2px solid #9c27b0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AIIcon sx={{ color: '#9c27b0' }} />
                <Typography variant="subtitle2" fontWeight={600} color="#9c27b0">
                  ✨ AI Tarafından Oluşturulan Form
                </Typography>
              </Box>

              <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f8f9fa' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    📝 {result.formName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {result.formDescription}
                  </Typography>
                </CardContent>
              </Card>

              {/* Enhanced Fields Display */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                📋 Form Alanları ({result.fields?.length || 0}):
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {result.fields?.map((field: any, index: number) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Chip
                      label={`${field.label} (${field.type})`}
                      size="small"
                      variant="outlined"
                      sx={{ width: '100%', justifyContent: 'flex-start' }}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Entities */}
              {result.entities && result.entities.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    🗄️ Veri Modelleri ({result.entities.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {result.entities.map((entity: any, index: number) => (
                      <Chip
                        key={index}
                        label={`${entity.name} (${entity.fields.length} alan)`}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PreviewIcon />}
                  onClick={handleApply}
                  sx={{ flex: 1, textTransform: "none" }}
                >
                  ✅ Forma Ekle ve Düzenle
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setResult(null)}
                  sx={{ textTransform: "none" }}
                >
                  Yeni Deneme
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Enhanced Footer */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: "#fff",
          borderTop: "1px solid #e0e0e0",
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
          💡 Detaylı açıklama = Daha iyi sonuç
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip label={`${promptHistory.length} Geçmiş`} size="small" variant="outlined" />
          <Chip label={`${favoriteTemplates.length} Favori`} size="small" variant="outlined" />
        </Box>
      </Box>
    </Box>
  );
}

// Mock form generator (gerçek AI API'si buraya bağlanacak)
function generateMockForm(prompt: string, settings?: any): any {
  const lowerPrompt = prompt.toLowerCase();

  // Simple keyword-based mock generation
  const isMusteriForm = lowerPrompt.includes("müşteri") || lowerPrompt.includes("customer");
  const isPersonelForm = lowerPrompt.includes("personel") || lowerPrompt.includes("çalışan");
  const isSeyahatForm = lowerPrompt.includes("seyahat") || lowerPrompt.includes("travel");

  if (isMusteriForm) {
    return {
      formName: "Müşteri Kayıt Formu",
      formDescription: "Müşteri bilgilerini kaydetmek için form",
      entities: [
        {
          name: "Customer",
          fields: [
            { name: "name", type: "string", required: true },
            { name: "email", type: "string", required: true, unique: true },
            { name: "phone", type: "string" },
            { name: "address", type: "string" },
          ],
        },
      ],
      fields: [
        { label: "İsim", type: "Input", required: true },
        { label: "Email", type: "Input", required: true },
        { label: "Telefon", type: "Input" },
        { label: "Adres", type: "TextArea" },
      ],
      formSchema: {
        type: "object",
        properties: {
          name: { type: "string", title: "İsim", "x-decorator": "FormItem", "x-component": "Input" },
          email: { type: "string", title: "Email", "x-decorator": "FormItem", "x-component": "Input" },
          phone: { type: "string", title: "Telefon", "x-decorator": "FormItem", "x-component": "Input" },
          address: { type: "string", title: "Adres", "x-decorator": "FormItem", "x-component": "Input.TextArea" },
        },
      },
    };
  } else if (isPersonelForm) {
    return {
      formName: "Personel Bilgi Formu",
      formDescription: "Çalışan bilgilerini kaydetmek için form",
      entities: [
        {
          name: "Employee",
          fields: [
            { name: "firstName", type: "string", required: true },
            { name: "lastName", type: "string", required: true },
            { name: "department", type: "string" },
            { name: "position", type: "string" },
            { name: "salary", type: "number" },
          ],
        },
      ],
      fields: [
        { label: "Ad", type: "Input", required: true },
        { label: "Soyad", type: "Input", required: true },
        { label: "Departman", type: "Select" },
        { label: "Pozisyon", type: "Input" },
        { label: "Maaş", type: "NumberPicker" },
      ],
      formSchema: {
        type: "object",
        properties: {
          firstName: { type: "string", title: "Ad", "x-decorator": "FormItem", "x-component": "Input" },
          lastName: { type: "string", title: "Soyad", "x-decorator": "FormItem", "x-component": "Input" },
          department: { type: "string", title: "Departman", "x-decorator": "FormItem", "x-component": "Select" },
          position: { type: "string", title: "Pozisyon", "x-decorator": "FormItem", "x-component": "Input" },
          salary: { type: "number", title: "Maaş", "x-decorator": "FormItem", "x-component": "NumberPicker" },
        },
      },
    };
  } else if (isSeyahatForm) {
    return {
      formName: "Seyahat Talep Formu",
      formDescription: "İş seyahati talebi oluşturmak için form",
      entities: [
        {
          name: "TravelRequest",
          fields: [
            { name: "destination", type: "string", required: true },
            { name: "startDate", type: "date", required: true },
            { name: "endDate", type: "date", required: true },
            { name: "estimatedBudget", type: "number" },
            { name: "purpose", type: "string" },
          ],
        },
      ],
      fields: [
        { label: "Varış Yeri", type: "Input", required: true },
        { label: "Başlangıç Tarihi", type: "DatePicker", required: true },
        { label: "Bitiş Tarihi", type: "DatePicker", required: true },
        { label: "Tahmini Bütçe", type: "NumberPicker" },
        { label: "Amaç", type: "TextArea" },
      ],
      formSchema: {
        type: "object",
        properties: {
          destination: { type: "string", title: "Varış Yeri", "x-decorator": "FormItem", "x-component": "Input" },
          startDate: { type: "string", title: "Başlangıç Tarihi", "x-decorator": "FormItem", "x-component": "DatePicker" },
          endDate: { type: "string", title: "Bitiş Tarihi", "x-decorator": "FormItem", "x-component": "DatePicker" },
          estimatedBudget: { type: "number", title: "Tahmini Bütçe", "x-decorator": "FormItem", "x-component": "NumberPicker" },
          purpose: { type: "string", title: "Amaç", "x-decorator": "FormItem", "x-component": "Input.TextArea" },
        },
      },
    };
  }

  // Generic form
  return {
    formName: "Özel Form",
    formDescription: "AI tarafından oluşturulan form",
    entities: [],
    fields: [
      { label: "Alan 1", type: "Input" },
      { label: "Alan 2", type: "Input" },
    ],
    formSchema: {
      type: "object",
      properties: {
        field1: { type: "string", title: "Alan 1", "x-decorator": "FormItem", "x-component": "Input" },
        field2: { type: "string", title: "Alan 2", "x-decorator": "FormItem", "x-component": "Input" },
      },
    },
  };
}
