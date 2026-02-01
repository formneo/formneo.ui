import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Autocomplete from "@mui/material/Autocomplete";
import foto1 from "assets/images/btplogo.jpg";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import FormField from "../FormField";
import MDButton from "components/MDButton";

import { ProjectsApi } from "api/generated";
import getConfiguration from "confiuration";
import { en } from "@fullcalendar/core/internal-common";
import { Height, Padding, Photo } from "@mui/icons-material";
import { Divider, Modal, Zoom } from "@mui/material";
import productImage from "assets/images/products/product-11.jpg";
import MDDropzone from "components/MDDropzone";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { MessageBoxType } from "@ui5/webcomponents-react";
import ProductImage from "../ProductImage";
import { useTranslation } from "react-i18next";

export interface CategoryParams {
  id: string;
  name: string;
  description: string;
  categoryId: number;
  photo: string;
  startDate: string;
  endDate: string;
  projectGain: string;
  projectLearn: string;
  projectTags: string;
}

interface ProjectInfoProps {
  CardCategory?: CategoryParams;
  params: any;
}

function ProductInfo({ params }: ProjectInfoProps): JSX.Element {
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
  const dispatchAlert = useAlert();
  const [nameofCategories, setNameofCategories] = useState([]);
  const [CardCategory, setCardCategory] = useState<CategoryParams | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);
  const [base64Image, setBase64Image] = useState("");
  const [arrayImage, setArrayImage] = useState<string[]>([]);
  const [OnlyReadMis, setOnlyReadMis] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentCategory, setCurrentCategory] = useState(null);
  const [denemeVerisi, setDenemeVerisi] = useState(null);
  const dispatchBusy = useBusy();
  const [tagsArray, setTagsArray] = useState([]);
  const [defaultLogoBase64, setDefaultLogoBase64] = useState("");
  const { t } = useTranslation();

  const [formData, setFormData] = useState<CategoryParams>({
    categoryId: null,
    description: "",
    endDate: "",
    id: "",
    name: "",
    photo: "",
    projectGain: "",
    projectLearn: "",
    projectTags: "",
    startDate: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isOnlyRead = queryParams.get("isOnlyRead") === "true";

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-CA", options); // 'en-CA' formatı yyyy-mm-dd
  };

  useEffect(() => {
    setOnlyReadMis(isOnlyRead);
  }, []);

  const checkData = async () => {
    dispatchBusy({ isBusy: true });
    const configuration = getConfiguration();
    const api = new ProjectsApi(configuration);
    const data = await api.apiProjectsGetByProjectIdProjectListGet(params.id);
    setCardCategory(data.data as any);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    if (params && params.id) {
      checkData();
    } else {
      setFormData({
        categoryId: null,
        description: "",
        endDate: formatDate("2.1.2025"),
        id: "",
        name: "",
        photo: "",
        projectGain: "",
        projectLearn: "",
        projectTags: "",
        startDate: formatDate("01.01.2025"),
      });
    }
  }, [params.id]);

  useEffect(() => {
    if (CardCategory) {
      const tagsArray = CardCategory.projectTags.split(",").map((tag) => ({ description: tag }));
      setTagsArray(tagsArray);

      setFormData({
        categoryId: CardCategory.categoryId,
        description: CardCategory.description,
        endDate: formatDate(CardCategory.endDate),
        id: CardCategory.id,
        name: CardCategory.name,
        photo: CardCategory.photo,
        projectGain: CardCategory.projectGain,
        projectLearn: CardCategory.projectLearn,
        projectTags: CardCategory.projectTags,
        startDate: formatDate(CardCategory.startDate),
      });
      setBase64Image(CardCategory.photo);
    }
  }, [CardCategory]);

  const getProject = async () => {
    dispatchBusy({ isBusy: true });
    const configuration = getConfiguration();
    const api = new ProjectsApi(configuration);
    const data = await api.apiProjectsGetCategoryGet();
    setNameofCategories(data.data as any);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    getProject();
  }, []);

  const updateData = async (formData: any) => {
    dispatchBusy({ isBusy: true });
    const configuration = getConfiguration();
    const api = new ProjectsApi(configuration);
    try {
      await api.apiProjectsPut(formData);
      
      
      navigate("/profile/all-projects");
    } catch (error) {
      console.error(error);
    }
    dispatchBusy({ isBusy: false });
  };

  const createData = async (formData: any) => {
    dispatchBusy({ isBusy: true });
    const { id, ...dataWithoutId } = formData;
    if (dataWithoutId.startDate || dataWithoutId.endDate) {
      const configuration = getConfiguration();
      const api = new ProjectsApi(configuration);
      await api.apiProjectsPost(dataWithoutId);
      
      navigate("/profile/all-projects");
    } else {
      dispatchAlert({
        message: t("ns1:ProfilePage.EditProject.TarihDoldur"),
        type: MessageBoxType.Error,
      });
      dispatchBusy({ isBusy: false });
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCategoryChange = (event: any, newValue: any) => {
    if (newValue) {
      const selectedIndex = nameofCategories.findIndex(
        (category) => category.description === newValue.description
      );
      setFormData({
        ...formData,
        categoryId: selectedIndex, // Set the index of the selected category
      });
    } else {
      setFormData({
        ...formData,
        categoryId: null, // Reset if no category is selected
      });
    }
  };

  const handleTagsChange = (event: any, newValue: any) => {
    const tagsString = newValue.map((tag: any) => tag.description).join(", ");
    setTagsArray(newValue);
    setFormData({
      ...formData,
      projectTags: tagsString, // String olarak ayarlanmış etiketler
    });
  };

  const fileInputRef = useRef(null);

  const handleEditClick = () => {
    // Dosya girişi elementini tetikle
    fileInputRef.current.click();
  };

  const handleFileChange = (event: any) => {
    const files = event.target.files;

    if (files.length === 0) {
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE) {
        dispatchAlert({
          message: t("ns1:ProfilePage.EditProject.DosyaBoyut"),
          type: MessageBoxType.Error,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const base64String = reader.result.split(",")[1];
          setBase64Image(base64String);
          setArrayImage((prevArrayImage) => [...prevArrayImage, base64String]);
          setFormData({ ...formData, photo: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveClick = () => {
    setBase64Image("");
    setFormData({ ...formData, photo: "" });
  };

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handlePhotoOpenModal = () => setIsPhotoModalOpen(true);
  const handlePhotoCloseModal = () => setIsPhotoModalOpen(false);

  const displayKeys: { [key: string]: string } = {
    name: t("ns1:ProfilePage.EditProject.ProjeAdi"),
    description: t("ns1:ProfilePage.EditProject.Aciklama"),
    startDate: t("ns1:ProfilePage.EditProject.BaslangicTarihi"),
    endDate: t("ns1:ProfilePage.EditProject.BitisTarihi"),
    projectTags: t("ns1:ProfilePage.EditProject.Etiketler"),
    categoryId: t("ns1:ProfilePage.EditProject.Kategori"),
    projectLearn: t("ns1:ProfilePage.EditProject.ProjeTecrube"),
    projectGain: t("ns1:ProfilePage.EditProject.ProjeKazanimlari"),
  };
  const handleSubmit = async () => {
    for (const [key, value] of Object.entries(formData)) {
      if (key === "id" || key === "photo") continue;

      const displayKey = displayKeys[key] || key;
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "number" && isNaN(value))
      ) {
        dispatchAlert({
          message: displayKey + t("ns1:ProfilePage.EditProject.BosAlan"),
          type: MessageBoxType.Error,
        });
        return;
      }
    }

    if (params && params.id) {
      await updateData(formData);
    } else {
      await createData(formData);
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid lg={3.5} sx={{ paddingLeft: "15px" }}>
          <Card
            sx={{
              ...(isOnlyRead
                ? {}
                : {
                    "&:hover .card-header": {
                      transform: "translate3d(0, -60px, 0)",
                      zIndex: 11,
                    },
                  }),
            }}
          >
            <MDBox
              position="relative"
              borderRadius="lg"
              mt={-3}
              mx={2}
              className="card-header"
              sx={{ transition: "transform 300ms cubic-bezier(0.34, 1.61, 0.7, 1)" }}
            >
              {base64Image && (
                <MDBox position="relative" width="100%" height="100%">
                  <MDBox
                    component="img"
                    src={`data:image/png;base64,${base64Image}`}
                    alt="Product Image"
                    borderRadius="lg"
                    shadow="sm"
                    width="100%"
                    height="100%"
                    position="relative"
                    zIndex={10}
                    mb={2}
                  />
                </MDBox>
              )}
            </MDBox>

            {!isOnlyRead && (
              <MDBox textAlign="center" pt={base64Image ? 2 : 15} pb={3} px={3}>
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  mt={-11}
                  position="relative"
                  zIndex={1}
                >
                  <MDBox mr={1} mt={base64Image ? 0 : 4}>
                    <MDButton
                      style={{ marginRight: "15px", marginLeft: "15px" }}
                      variant="gradient"
                      color="info"
                      size="small"
                      onClick={handleEditClick}
                    >
                      {t("ns1:ProfilePage.EditProject.Ekle")}
                    </MDButton>

                    <MDButton
                      onClick={handleRemoveClick}
                      variant="outlined"
                      color="dark"
                      size="small"
                    >
                      {t("ns1:ProfilePage.EditProject.Kaldir")}
                    </MDButton>
                  </MDBox>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }} // Giriş alanını gizle
                    onChange={handleFileChange}
                  />
                </MDBox>

                <MDTypography variant="h5" fontWeight="regular" sx={{ mt: 4 }}>
                  {t("ns1:ProfilePage.EditProject.ProjeResmi")}
                </MDTypography>
                <MDTypography variant="body2" color="text" sx={{ mt: 1.5, mb: 1 }}>
                  {t("ns1:ProfilePage.EditProject.ResimYukleme")}
                </MDTypography>
              </MDBox>
            )}
          </Card>
        </Grid>

        <Grid xs={12} lg={8.2} sx={{ paddingLeft: "30px" }}>
          <Card>
            <MDBox p={3}>
              <MDTypography variant="h5">
                {t("ns1:ProfilePage.EditProject.ProjeBilgileri")}
              </MDTypography>
              <MDBox mt={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      type="text"
                      label={t("ns1:ProfilePage.EditProject.ProjeAdi")}
                      name="name"
                      value={formData.name}
                      disabled={isOnlyRead}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      disabled={isOnlyRead}
                      options={nameofCategories}
                      value={
                        formData.categoryId !== null ? nameofCategories[formData.categoryId] : null
                      }
                      isOptionEqualToValue={(option, value) =>
                        option?.description === value?.description
                      }
                      getOptionLabel={(option: any) => option.description}
                      onChange={handleCategoryChange}
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          variant="outlined"
                          label={t("ns1:ProfilePage.EditProject.Kategori")}
                          inputProps={{ ...params.inputProps, sx: { height: "12px" } }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                <MDBox mt={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormField
                        type="date"
                        disabled={isOnlyRead}
                        variant="outlined"
                        label={t("ns1:ProfilePage.EditProject.BaslangicTarihi")}
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormField
                        type="date"
                        disabled={isOnlyRead}
                        label={t("ns1:ProfilePage.EditProject.BitisTarihi")}
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                </MDBox>
                <MDBox mt={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormField
                        type="text"
                        label={t("ns1:ProfilePage.EditProject.Aciklama")}
                        disabled={isOnlyRead}
                        name="description"
                        multiline
                        rows={5}
                        placeholder={t("ns1:ProfilePage.EditProject.Aciklama")}
                        InputLabelProps={{ shrink: true }}
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormField
                        type="text"
                        label={t("ns1:ProfilePage.EditProject.Musteri")}
                        disabled={isOnlyRead}
                        name="customer"
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                </MDBox>
              </MDBox>
            </MDBox>

            <Divider></Divider>
            <MDBox p={3} mt={-2}>
              <MDTypography variant="h5" fontWeight="bold">
                {t("ns1:ProfilePage.EditProject.Detaylar")}
              </MDTypography>
              <MDBox mt={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      type="text"
                      disabled={isOnlyRead}
                      label={t("ns1:ProfilePage.EditProject.ProjeKazanimlari")}
                      name="projectGain"
                      value={formData.projectGain}
                      multiline
                      rows={4}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      type="text"
                      disabled={isOnlyRead}
                      label={t("ns1:ProfilePage.EditProject.ProjeTecrube")}
                      name="projectLearn"
                      value={formData.projectLearn}
                      multiline
                      rows={4}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </MDBox>
              <MDBox mt={1}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <MDBox my={2} display="inline-block">
                      <MDTypography
                        component="label"
                        required
                        disabled={isOnlyRead}
                        variant="button"
                        fontWeight="regular"
                        color="text"
                      >
                        {t("ns1:ProfilePage.EditProject.Etiketler")}
                      </MDTypography>
                    </MDBox>
                    <Autocomplete
                      multiple
                      getOptionLabel={(option: any) => option.description}
                      options={nameofCategories}
                      value={tagsArray.length > 0 ? tagsArray : []}
                      isOptionEqualToValue={(option, value) =>
                        option.description.trim() === value.description.trim()
                      }
                      disabled={isOnlyRead}
                      onChange={handleTagsChange}
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          variant="outlined"
                          label={t("ns1:ProfilePage.EditProject.Etiketler")}
                          inputProps={{ ...params.inputProps, sx: { height: "12px" } }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </MDBox>
              {!isOnlyRead && (
                <MDBox mt={7} display="flex" justifyContent="flex-end">
                  <Grid container justifyContent="flex-end" spacing={2}>
                    <Grid item>
                      <MDButton
                        variant="outlined"
                        color="secondary"
                        onClick={() => navigate("/profile/all-projects")}
                      >
                        {t("ns1:ProfilePage.EditProject.GeriDon")}
                      </MDButton>
                    </Grid>
                    <Grid item>
                      <MDButton
                        type="submit"
                        variant="gradient"
                        color="info"
                        onClick={handleSubmit}
                      >
                        {t("ns1:ProfilePage.EditProject.Kaydet")}
                      </MDButton>
                    </Grid>
                  </Grid>
                </MDBox>
              )}
            </MDBox>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default ProductInfo;
