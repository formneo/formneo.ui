import { TicketProjectsApi, TicketProjectsListDto } from "api/generated";
import getConfiguration from "confiuration";
import React, { useEffect, useRef, useState } from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Autocomplete,
} from "@mui/material";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ReactQuill from "react-quill";
import { CvData } from "layouts/pages/resumeBuilder";
import "../summary/summary.css";
import ProjectRenderer from "./projectRenderer";
interface ProjectsProps {
  cvDataProjects: CvData["projects"];
  setCvDataProjects: (data: CvData["projects"]) => void;
}

function Projects({ cvDataProjects, setCvDataProjects }: ProjectsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [maxHeight, setMaxHeight] = useState("0px");
  const contentRef = useRef<HTMLDivElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [projects, setProjects] = useState<TicketProjectsListDto[]>([]);
  const [newProject, setNewProject] = useState({
    id: 0,
    name: "",
    project: null,
    description: "",
  });
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setMaxHeight("0px");
    }
    
  }, [isOpen, cvDataProjects]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        let config = getConfiguration();
        let api = new TicketProjectsApi(config);
        let response = await api.apiTicketProjectsGetActiveProjectsGet();
        setProjects(response.data);
      } catch (error) {
        
      }
    };
    fetchProjects();
  }, []);

  const handleSaveNewProject = () => {
    let newProjectTemp = {
        ...newProject,
        id: cvDataProjects.length + 1,
      };
    setCvDataProjects([...cvDataProjects, newProjectTemp]);
    setOpenDialog(false);
    setIsEdit(false);
    setNewProject({
        id: 0,
        name: "",
        project: null,
        description: "",
    });
}

const handleUpdateProject = () => {
    setCvDataProjects(cvDataProjects.map((project) => project.id === newProject.id ? newProject : project));
    setOpenDialog(false);
    setIsEdit(false);
    setNewProject({
        id: 0,
        name: "",
        project: null,
        description: "",
    });
    setIsEdit(false);
}

const handleEditProject = (id: number) => {
    
    
    setOpenDialog(true);
    setIsEdit(true);
    setNewProject(cvDataProjects.find((project) => project.id === id));
}

const handleDeleteProject = (id: number) => {
    setCvDataProjects(cvDataProjects.filter((project) => project.id !== id));
}

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
          <ContentPasteIcon
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
            Projects
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
        <ProjectRenderer
          projectList={cvDataProjects}
          handleEditProject={handleEditProject}
          handleDeleteProject={handleDeleteProject}
        />
        <MDButton
          variant="contained"
          color="info"
          fullWidth
          onClick={() => {
            setOpenDialog(true);
            setNewProject({
              id: 0,
              name: "",
              project: null,
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
        Add Project
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
              <ContentPasteIcon
                sx={{
                  fontSize: "28px",
                  color: "#1A73E8",
                  borderRadius: "8px",
                }}
              />
              <MDTypography variant="h5" sx={{ fontWeight: "bold", color: "#344767" }}>
                {isEdit ? "Edit Selected Project" : "Add New Project"}
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
                setNewProject({
                  id: 0,
                  name: "",
                  project: null,
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
                label="Project Name"
                fullWidth
                value={newProject.name}
                onChange={(e: any) => setNewProject({ ...newProject, name: e.target.value })}
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
              <Autocomplete
                options={projects.filter((project) => !cvDataProjects.some((p) => p.project?.id === project.id))}
                getOptionLabel={(option) => option.name}
                value={newProject.project}
                renderInput={(params) => (
                  <MDInput
                    {...params}
                    label="Project"
                    inputProps={{ ...params.inputProps, style: { height: "12px" } }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(event, newValue) => {
                    setNewProject({ ...newProject, project: newValue });
                    
                }}
              />
            </Grid>

            <Grid item xs={12} md={12} lg={12}>
              <MDTypography variant="caption" fontWeight="medium" color="text">
                Description
              </MDTypography>
              <ReactQuill
                theme="snow"
                className="custom-quill"
                style={{
                  minHeight: "220px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
                value={newProject.description}
                onChange={(value) => setNewProject({ ...newProject, description: value })}
                placeholder="Describe your project..."
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
              setNewProject({
                id: 0,
                name: "",
                project: null,
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
            onClick={isEdit ? handleUpdateProject : handleSaveNewProject}
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

export default Projects;
