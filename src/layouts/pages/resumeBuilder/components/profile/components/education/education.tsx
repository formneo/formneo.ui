import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import SchoolIcon from "@mui/icons-material/School";
import React, { useEffect, useRef, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import MDButton from "components/MDButton";
import AddIcon from "@mui/icons-material/Add";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import MDInput from "components/MDInput";
import ReactQuill from "react-quill";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import "../summary/summary.css";
import EducationRenderer from "./educationRenderer";
import { CvData } from "layouts/pages/resumeBuilder";

interface EducationProps {
  cvDataEducation: CvData["education"];
  setCvDataEducation: (data: CvData["education"]) => void;
}

function Education({ cvDataEducation, setCvDataEducation }: EducationProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [maxHeight, setMaxHeight] = useState("0px");
  const contentRef = useRef<HTMLDivElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  // const [educationList, setEducationList] = useState<any[]>([
  //   {
  //     id: 0,
  //     institution: "Harvard University",
  //     typeOfStudy: "Bachelor of Science",
  //     areaOfStudy: "Computer Science",
  //     score: "3.5",
  //     dateOrDateRange: "2023 March - Today",
  //     description:
  //       "I graduated from Harvard University with a Bachelor of Science in Computer Science.",
  //   },
  // ]);
  const [newEducation, setNewEducation] = useState({
    id:0,
    institution: "",
    typeOfStudy: "",
    areaOfStudy: "",
    score: "",
    dateOrDateRange: "",
    description: "",
  });



  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setMaxHeight("0px");
    }
  }, [isOpen, cvDataEducation]);

  const handleSaveNewEducation = () => {
    const {id, ...rest} = newEducation;
    let newEducationTemp = {
      ...rest,
      id: cvDataEducation.length + 1,
    };
 

    
    setCvDataEducation([...cvDataEducation, newEducationTemp]);
    setOpenDialog(false);
    setNewEducation({
      id: 0,
      institution: "",
      typeOfStudy: "",
      areaOfStudy: "",
      dateOrDateRange: "",
      description: "",
      score: "",
    });

    setIsEdit(false);
  };
  const handleDeleteEducation = (id: number) => {
    setCvDataEducation(cvDataEducation.filter((education) => education.id !== id));
  };
  const handleEditEducation = (id: number) => {
    setOpenDialog(true);
    setIsEdit(true);
    setNewEducation(cvDataEducation.find((education) => education.id === id));
  };
  const handleUpdateEducation = () => {
    setCvDataEducation(
      cvDataEducation.map((education) =>
        education.id === newEducation.id ? { ...newEducation, id: newEducation.id } : education
      )
    );
    setOpenDialog(false);
    setIsEdit(false);
    setNewEducation({
      id: 0,
      institution: "",
      typeOfStudy: "",
      areaOfStudy: "",
      dateOrDateRange: "",
      description: "",
      score: "",
    });
    setIsEdit(false);
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
          <SchoolIcon
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
            Eğitim
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
        <EducationRenderer
          educationList={cvDataEducation}
          handleEditEducation={handleEditEducation}
          handleDeleteEducation={handleDeleteEducation}
        />
        <MDButton
          variant="contained"
          color="info"
          fullWidth
          onClick={() => {
            setOpenDialog(true);
            setNewEducation({
              id: 0,
              institution: "",
              typeOfStudy: "",
              areaOfStudy: "",
              dateOrDateRange: "",
              description: "",
              score: "",
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
          Eğitim Ekle
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
              <SchoolIcon
                sx={{
                  fontSize: "28px",
                  color: "#1A73E8",
                  borderRadius: "8px",
                }}
              />
              <MDTypography variant="h5" sx={{ fontWeight: "bold", color: "#344767" }}>
                {isEdit ? "Eğitim Düzenle" : "Eğitim Ekle"}
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
                setNewEducation({
                  id: 0,
                  institution: "",
                  typeOfStudy: "",
                  areaOfStudy: "",
                  dateOrDateRange: "",
                  description: "",
                  score: "",
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
                label="Kurum"
                fullWidth
                value={newEducation.institution}
                onChange={(e: any) =>
                  setNewEducation({ ...newEducation, institution: e.target.value })
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
            <Grid item xs={12} md={6}>
              <MDInput
                label="Öğrenim Türü"
                fullWidth
                value={newEducation.typeOfStudy}
                onChange={(e: any) =>
                  setNewEducation({ ...newEducation, typeOfStudy: e.target.value })
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
            <Grid item xs={12} md={6}>
              <MDInput
                label="Çalışma Alanı"
                fullWidth
                value={newEducation.areaOfStudy}
                onChange={(e: any) =>
                  setNewEducation({ ...newEducation, areaOfStudy: e.target.value })
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
            <Grid item xs={12} md={6}>
              <MDInput
                label="Not"
                placeholder="GPA 3.5"
                fullWidth
                value={newEducation.score}
                onChange={(e: any) => setNewEducation({ ...newEducation, score: e.target.value })}
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
                label="Tarih"
                placeholder="2023 March - Today"
                fullWidth
                value={newEducation.dateOrDateRange}
                onChange={(e: any) =>
                  setNewEducation({ ...newEducation, dateOrDateRange: e.target.value })
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
            <Grid item xs={12}>
              <MDBox sx={{ mt: 1 }}>
                <MDTypography variant="caption" fontWeight="medium" color="text">
                  Açıklama
                </MDTypography>
                <MDBox sx={{ mt: 0.5, border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }}>
                  <ReactQuill
                    theme="snow"
                    className="custom-quill"
                    value={newEducation.description}
                    onChange={(value) => setNewEducation({ ...newEducation, description: value })}
                    placeholder="Eğitim hakkında açıklama giriniz..."
                  />
                </MDBox>
              </MDBox>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <MDButton
            variant="outlined"
            color="error"
            onClick={() => {
              setOpenDialog(false);
              setNewEducation({
                id: 0,
                institution: "",
                typeOfStudy: "",
                areaOfStudy: "",
                dateOrDateRange: "",
                description: "",
                score: "",
              });
              setIsEdit(false);
              console.log("sildir")
            }}

            sx={{ borderRadius: "8px", px: 4, py: 1 }}
          >
            İptal
          </MDButton>
          <MDButton
            variant="contained"
            color="info"
            onClick={isEdit ? handleUpdateEducation : handleSaveNewEducation}
            sx={{
              borderRadius: "8px",
              px: 4,
              py: 1,
              boxShadow: "0 4px 10px rgba(26,115,232,0.15)",
            }}
          >
            {isEdit ? "Güncelle" : "Ekle"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default Education;
