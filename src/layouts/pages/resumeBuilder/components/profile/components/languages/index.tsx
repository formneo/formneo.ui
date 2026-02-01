import { CvData } from "layouts/pages/resumeBuilder";
import React, { useState, useRef, useEffect } from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import TranslateIcon from "@mui/icons-material/Translate";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { Grid } from "@mui/material";
import ReactQuill from "react-quill";
import LanguageRenderer from "./languageRenderer";
import { Slider } from "@ui5/webcomponents-react";


interface LanguagesProps {
  cvDataLanguages: CvData["languages"];
  setCvDataLanguages: (data: CvData["languages"]) => void;
}

function Languages({ cvDataLanguages, setCvDataLanguages }: LanguagesProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [maxHeight, setMaxHeight] = useState("0px");
  const contentRef = useRef<HTMLDivElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newLanguage, setNewLanguage] = useState({
    id: 0,
    language: "",
    level: "0",
    description: "",
  });

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setMaxHeight("0px");
    }
  }, [isOpen, cvDataLanguages]);

  const handleSaveNewLanguage = () => {
    let newLanguageTemp = {
      ...newLanguage,
      id: cvDataLanguages.length + 1,
    };
    setCvDataLanguages([...cvDataLanguages, newLanguageTemp]);
    setNewLanguage({
      id: 0,
      language: "",
      level: "",
      description: "",
    });
    setIsEdit(false);

    setOpenDialog(false);
  };

  const handleUpdateLanguage = () => {
    setCvDataLanguages([...cvDataLanguages, newLanguage]);
    setNewLanguage({
      id: 0,
      language: "",
      level: "",
      description: "",
    });
    setIsEdit(false);
    setOpenDialog(false);
  };
  const handleEditLanguage = (id: number) => {
    setOpenDialog(true);
    setIsEdit(true);
    setNewLanguage(cvDataLanguages.find((language) => language.id === id));
  };
  const handleDeleteLanguage = (id: number) => {
    setCvDataLanguages(cvDataLanguages.filter((language) => language.id !== id));
  };

  return (
    <MDBox sx={{ padding: "0 24px 24px 24px" }}>
      <MDBox
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          paddingBottom: 2,
          marginBottom: 2,
        }}
      >
        <MDBox sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
          <TranslateIcon
            sx={{
              fontSize: "32px",
              color: "#1A73E8",

              borderRadius: "8px",
            }}
          />
          <MDTypography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "#344767",
              letterSpacing: 0.2,
            }}
          >
            Languages
          </MDTypography>
        </MDBox>
        {isOpen ? (
          <KeyboardArrowDownIcon
            fontSize="medium"
            sx={{
              cursor: "pointer",
              fontSize: "28px",
              color: "#5e72e4",
              borderRadius: "50%",
              padding: "4px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(94,114,228,0.1)",
              },
            }}
            onClick={() => setIsOpen(!isOpen)}
          />
        ) : (
          <KeyboardArrowLeftIcon
            fontSize="medium"
            sx={{
              cursor: "pointer",
              fontSize: "28px",
              color: "#5e72e4",
              borderRadius: "50%",
              padding: "4px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(94,114,228,0.1)",
              },
            }}
            onClick={() => setIsOpen(!isOpen)}
          />
        )}
      </MDBox>
      <MDBox
        ref={contentRef}
        sx={{
          maxHeight: maxHeight,
          overflow: "hidden",
          transition: "max-height 0.4s ease-in-out",
        }}
      >
        <LanguageRenderer
          languageList={cvDataLanguages}
          handleEditLanguage={handleEditLanguage}
          handleDeleteLanguage={handleDeleteLanguage}
        />
        <MDButton
          variant="contained"
          color="info"
          fullWidth
          onClick={() => {
            setOpenDialog(true);
            setNewLanguage({
              id: 0,
              language: "",
              level: "",
              description: "",
            });
          }}
          sx={{
            mt: 2,
            borderRadius: "10px",
            fontWeight: "bold",
            py: 1.2,
            boxShadow: "0 4px 10px rgba(26,115,232,0.15)",
            transition: "transform 0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 15px rgba(26,115,232,0.25)",
            },
          }}
        >
          <AddIcon sx={{ mr: 1 }} />
          Add Language
        </MDButton>
      </MDBox>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          },
        }}
        maxWidth="md"
      >
        <DialogTitle>
          <MDBox
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <MDBox sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
              <TranslateIcon
                sx={{
                  fontSize: "28px",
                  color: "#1A73E8",
                  borderRadius: "8px",
                }}
              />
              <MDTypography variant="h5" sx={{ fontWeight: "bold", color: "#344767" }}>
                {isEdit ? "Edit Selected Language" : "Add New Language"}
              </MDTypography>
            </MDBox>
            <CloseIcon
              sx={{
                fontSize: "22px",
                color: "#f5365c",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "scale(1.15)",
                  color: "#ea0b46",
                },
              }}
              onClick={() => {
                setOpenDialog(false);
                setNewLanguage({
                  id: 0,
                  language: "",
                  level: "",
                  description: "",
                });
                setIsEdit(false);
              }}
            />
          </MDBox>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <MDBox mb={2}></MDBox>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <MDInput
                label="Language"
                fullWidth
                value={newLanguage.language}
                onChange={(e: any) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "&:hover fieldset": { borderColor: "#1A73E8" },
                    "&.Mui-focused fieldset": { borderColor: "#1A73E8" },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MDInput
                label="Description"
                placeholder="Describe your language experience..."
                fullWidth
                value={newLanguage.description}
                onChange={(e: any) =>
                  setNewLanguage({ ...newLanguage, description: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "&:hover fieldset": { borderColor: "#1A73E8" },
                    "&.Mui-focused fieldset": { borderColor: "#1A73E8" },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={12} lg={12}>
              <Slider
                value={Number(newLanguage.level)}
                min={0}
                max={5}
                showTooltip={true}
                step={1}
                onChange={(e: any) => {
                  
                  setNewLanguage({ ...newLanguage, level: e.target.value.toString() });
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <MDButton
            variant="outlined"
            color="error"
            onClick={() => {
              setOpenDialog(false);
              setNewLanguage({
                id: 0,
                language: "",
                level: "",
                description: "",
              });
              setIsEdit(false);
              
            }}
            sx={{ borderRadius: "8px", px: 4, py: 1 }}
          >
            Cancel
          </MDButton>
          <MDButton
            variant="contained"
            color="info"
            onClick={isEdit ? handleUpdateLanguage : handleSaveNewLanguage}
            sx={{
              borderRadius: "8px",
              px: 4,
              py: 1,
              boxShadow: "0 4px 10px rgba(26,115,232,0.15)",
            }}
          >
            {isEdit ? "Update" : "Save"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default Languages;
