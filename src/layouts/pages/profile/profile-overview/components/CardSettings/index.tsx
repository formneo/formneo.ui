import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import MDAvatar from "components/MDAvatar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import React, { useEffect, useState } from "react";
import index0png from "assets/images/sapfiori.jpg";

import index2png from "assets/images/btplogo.jpg";

import getConfiguration from "confiuration";
import { ProjectsApi } from "api/generated";
import { Category } from "layouts/pages/profile/all-projects";
import { useBusy } from "layouts/pages/hooks/useBusy";
import MDButton from "components/MDButton";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";

function CardSettings({ name, description, id, userId, categoryName }: Category) {
  const [nameofCategories, setnameofCategories] = useState([]);
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const getnameofCategories = async () => {
    dispatchBusy({ isBusy: true });
    const config = getConfiguration();
    var api = new ProjectsApi(config);
    var data = await api.apiProjectsGetCategoryGet();
    setnameofCategories(data.data as any);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    getnameofCategories();
    
  }, []);

  let indexOfCategory = nameofCategories.findIndex(
    (category: any) => category.description === categoryName
  );
  
  let image: string;
  if (indexOfCategory === 0) image = index0png;
  else if (indexOfCategory === 1) image = index2png;

  const imageWidth = () => {
    switch (image) {
      case index0png:
        return "80px";
      case index2png:
        return "80px";
      default:
        return "60px"; // Varsayılan değer
    }
  };

  const imageHeight = () => {
    switch (image) {
      case index0png:
        return "80px";
      case index2png:
        return "80px";
      default:
        return "60px"; // Varsayılan değer
    }
  };


  return (
    <Card style={{ boxShadow: "-2px -2px 2px rgba(0, 0, 0, 0.1), 2px 2px 2px rgba(0, 0, 0, 0.1)" }}>
      <CardHeader
        avatar={
          <MDAvatar
            style={{ borderRadius: "20px", width: "80px", height: "80px" }}
            size="xl"
            bgColor="transparent"
          >
            <img
              src={image}
              alt="categoryIcons"
              style={{ width: imageWidth(), height: imageHeight() }}
            />
          </MDAvatar>
        }
        title={<MDTypography variant="h5">{name}</MDTypography>}
        subheader={
          <MDTypography style={{ fontSize: "14px" }} variant="button" fontWeight="regular" color="text">
            {categoryName}
          </MDTypography>
        }
        action={
          <MDBox>
            <VisibilityIcon
              style={{ color: "#757575", height: "30px", width: "30px", marginRight: "10px" }}
              sx={{ cursor: "pointer" }}
              onClick={() =>
                navigate(`/profile/all-projects/edit-project/${id}?isOnlyRead=true`)
              }
            ></VisibilityIcon>
          </MDBox>
        }
      ></CardHeader>
      <CardContent>
      <Divider
            sx={{ opacity: 10 }}
            textAlign="left"
            style={{
              color: "black",
              fontSize: "20px",
              width: "500px",
              marginLeft: "-30px",
              marginTop: "-20px",
            }}
          ></Divider>
          <MDBox
            mt={3}
            style={{
              marginBottom: "5px",
              paddingLeft: "5px",
              minHeight: "100px",
              maxHeight: "100px",
              overflowY: "auto",
            }}
          >
          <MDTypography fontSize="md" variant="body2" fontWeight="light">
            {description}
          </MDTypography>
        </MDBox>
      </CardContent>
    </Card>
  );
}

export default CardSettings;
