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
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Send as SendIcon,
  Lightbulb as IdeaIcon,
} from "@mui/icons-material";

interface AIAssistantProps {
  onFormGenerated: (schema: any, entities: any[]) => void;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Müşteri Kayıt Formu",
    prompt: "Müşteri kayıt formu yap. İsim, email, telefon ve adres alanları olsun.",
  },
  {
    title: "Personel Bilgi Formu",
    prompt: "Personel bilgi formu lazım. Ad, soyad, departman, pozisyon, maaş bilgileri.",
  },
  {
    title: "Seyahat Talep Formu",
    prompt: "Seyahat talep formu. Gidiş-dönüş tarihleri, lokasyon, tahmini bütçe.",
  },
  {
    title: "Fatura Formu",
    prompt: "Fatura formu. Müşteri seçimi, ürün listesi, toplam tutar hesaplama.",
  },
  {
    title: "Proje Takip Formu",
    prompt: "Proje takip formu. Proje adı, sorumlu kişi, başlangıç-bitiş tarihi, durum.",
  },
];

export default function AIAssistant({ onFormGenerated }: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Lütfen bir açıklama girin");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // TODO: Gerçek AI API'si buraya bağlanacak
      // Şimdilik mock response
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResult = generateMockForm(prompt);
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

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#fafafa" }}>
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: "#fff",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <AIIcon sx={{ color: "#9c27b0" }} />
        <Typography variant="subtitle2" fontWeight={600}>
          AI Form Assistant
        </Typography>
        <Chip label="Beta" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#f3e5f5", color: "#7b1fa2" }} />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {/* Info Box */}
        <Alert severity="info" icon={<IdeaIcon />} sx={{ mb: 2, fontSize: "0.75rem" }}>
          Yapmak istediğiniz formu açıklayın, AI sizin için tasarlasın!
        </Alert>

        {/* Prompt Input */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: "block" }}>
            Form Açıklaması:
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            size="small"
            placeholder="Örn: Müşteri kayıt formu yap. İsim, email, telefon ve adres alanları olsun. Email zorunlu ve unique olmalı."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />

          <Button
            fullWidth
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            sx={{
              mt: 2,
              bgcolor: "#9c27b0",
              "&:hover": { bgcolor: "#7b1fa2" },
              textTransform: "none",
            }}
          >
            {loading ? "Oluşturuluyor..." : "✨ Form Oluştur"}
          </Button>
        </Paper>

        {/* Example Prompts */}
        {!result && !loading && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: "block" }}>
              💡 Örnek Promptlar:
            </Typography>
            <List sx={{ p: 0 }}>
              {EXAMPLE_PROMPTS.map((example, index) => (
                <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleExampleClick(example.prompt)}
                    sx={{
                      borderRadius: 1,
                      border: "1px solid #e0e0e0",
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <ListItemText
                      primary={example.title}
                      secondary={example.prompt}
                      primaryTypographyProps={{
                        variant: "caption",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                      secondaryTypographyProps={{
                        variant: "caption",
                        fontSize: "0.7rem",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: "0.75rem" }}>
            {error}
          </Alert>
        )}

        {/* Result Preview */}
        {result && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: "block", color: "#9c27b0" }}>
              ✨ Oluşturulan Form:
            </Typography>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  📝 {result.formName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {result.formDescription}
                </Typography>
              </CardContent>
            </Card>

            {/* Entities */}
            {result.entities && result.entities.length > 0 && (
              <>
                <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: "block" }}>
                  🗄️ Entity&apos;ler ({result.entities.length}):
                </Typography>
                {result.entities.map((entity: any, index: number) => (
                  <Chip
                    key={index}
                    label={`${entity.name} (${entity.fields.length} alan)`}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5, fontSize: "0.7rem" }}
                  />
                ))}
              </>
            )}

            <Divider sx={{ my: 1.5 }} />

            {/* Fields */}
            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: "block" }}>
              📋 Form Alanları ({result.fields?.length || 0}):
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
              {result.fields?.map((field: any, index: number) => (
                <Chip
                  key={index}
                  label={`${field.label} (${field.type})`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.65rem" }}
                />
              ))}
            </Box>

            {/* Apply Button */}
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={handleApply}
              sx={{ textTransform: "none" }}
            >
              ✅ Forma Ekle
            </Button>
          </Paper>
        )}
      </Box>

      {/* Footer Info */}
      <Box
        sx={{
          p: 1,
          bgcolor: "#fff",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
          💡 İpucu: Detaylı açıklama yapın, AI daha iyi sonuç verir!
        </Typography>
      </Box>
    </Box>
  );
}

// Mock form generator (gerçek AI API'si buraya bağlanacak)
function generateMockForm(prompt: string): any {
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
