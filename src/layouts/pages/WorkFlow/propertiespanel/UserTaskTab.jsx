import React, { useState, useEffect } from "react";
import {
  Form,
  FormItem,
  Input,
  Button,
  Title,
} from "@ui5/webcomponents-react";
import { Grid, TextField, IconButton, Typography, Divider, Autocomplete } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import { UserApi } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

const UserTaskTab = ({
  initialValues,
  node,
  onButtonClick,
}) => {
  const [name, setName] = useState(initialValues?.name || "Kullanıcı Görevi");
  const [fields, setFields] = useState(initialValues?.fields || []);
  const [buttons, setButtons] = useState(initialValues?.buttons || []);
  const [searchByName, setSearchByName] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const dispatchBusy = useBusy();

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || "Kullanıcı Görevi");
      setFields(initialValues.fields || []);
      setButtons(initialValues.buttons || []);
      // Kullanıcı bilgisini yükle
      if (initialValues.userId || initialValues.userName) {
        setSelectedUser({
          id: initialValues.userId,
          userName: initialValues.userName,
          firstName: initialValues.userFirstName,
          lastName: initialValues.userLastName,
        });
      }
    }
  }, [initialValues]);

  const handleSearchByName = async (value) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });
      try {
        const conf = getConfiguration();
        const api = new UserApi(conf);
        const data = await api.apiUserGetAllUsersWithNameNameGet(value);
        const pureData = data.data;
        setSearchByName(pureData);
      } catch (error) {
        console.error("Kullanıcı arama hatası:", error);
        setSearchByName([]);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    }
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: `field-${Date.now()}`,
        label: "",
        value: "",
        displayValue: "",
      },
    ]);
  };

  const handleDeleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFields(newFields);
  };

  const handleAddButton = () => {
    setButtons([
      ...buttons,
      {
        id: `button-${Date.now()}`,
        label: "",
        action: "",
      },
    ]);
  };

  const handleDeleteButton = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index, field, value) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const handleSave = () => {
    if (onButtonClick && node) {
      onButtonClick({
        id: node.id,
        data: {
          ...initialValues,
          name,
          fields: fields.filter((f) => f.label || f.value),
          buttons: buttons.filter((b) => b.label),
          userId: selectedUser?.id || selectedUser?.userAppId,
          userName: selectedUser?.userName,
          userFirstName: selectedUser?.firstName,
          userLastName: selectedUser?.lastName,
          assignedUserName: selectedUser ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() : "",
        },
      });
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <Title level="H4" style={{ marginBottom: "16px" }}>
        Kullanıcı Görevi Özellikleri
      </Title>

      <Form>
        <FormItem label="Görev Adı">
          <Input
            value={name}
            onInput={(e: any) => setName(e.target.value)}
            placeholder="Kullanıcı görevi adı"
          />
        </FormItem>

        <Divider style={{ margin: "16px 0" }} />

        <Typography variant="h6" style={{ marginBottom: "8px" }}>
          Atanacak Kullanıcı
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: "16px" }}>
          Bu görevi hangi kullanıcıya atayacaksınız?
        </Typography>

        <Autocomplete
          sx={{ mb: 3 }}
          options={searchByName}
          getOptionLabel={(option) => {
            if (option.firstName && option.lastName) {
              return `${option.firstName} ${option.lastName}`;
            }
            return option.userAppName || option.userName || "";
          }}
          value={selectedUser}
          isOptionEqualToValue={(option, value) => {
            if (!option || !value) return false;
            return option.id === value.id || option.id === value.userAppId || option.userAppId === value.id;
          }}
          onChange={(event, newValue) => {
            setSelectedUser(newValue);
          }}
          onInputChange={(event, newInputValue) => {
            handleSearchByName(newInputValue);
          }}
          renderInput={(params) => (
            <MDInput
              {...params}
              size="large"
              placeholder="Kullanıcı ara..."
              label="Kullanıcı"
              inputProps={{ ...params.inputProps, sx: { height: "12px" } }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id || option.userAppId}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600 }}>
                  {option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : option.userAppName || option.userName}
                </span>
                {option.email && (
                  <span style={{ fontSize: "0.85em", color: "#666" }}>{option.email}</span>
                )}
                {option.userName && (
                  <span style={{ fontSize: "0.85em", color: "#666" }}>@{option.userName}</span>
                )}
              </div>
            </li>
          )}
        />

        {selectedUser && (
          <Typography variant="body2" color="success" style={{ marginBottom: "16px" }}>
            ✅ Seçili: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.userName})
          </Typography>
        )}

        <Divider style={{ margin: "16px 0" }} />

        <Typography variant="h6" style={{ marginBottom: "8px" }}>
          Gösterilecek Alanlar
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: "16px" }}>
          Kullanıcıya gösterilecek bilgileri ekleyin (Label - Value)
        </Typography>

        {fields.map((field, index) => (
          <Grid container spacing={2} key={field.id || index} style={{ marginBottom: "12px" }}>
            <Grid item xs={5}>
              <TextField
                fullWidth
                size="small"
                label="Label"
                value={field.label || ""}
                onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                placeholder="Alan adı"
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                fullWidth
                size="small"
                label="Value"
                value={field.value || field.displayValue || ""}
                onChange={(e) => handleFieldChange(index, "value", e.target.value)}
                placeholder="Değer veya ${formField}"
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton
                color="error"
                onClick={() => handleDeleteField(index)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <MDButton
          variant="outlined"
          color="info"
          size="small"
          onClick={handleAddField}
          startIcon={<AddIcon />}
          style={{ marginBottom: "16px" }}
        >
          Alan Ekle
        </MDButton>

        <Divider style={{ margin: "16px 0" }} />

        <Typography variant="h6" style={{ marginBottom: "8px" }}>
          Butonlar
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: "16px" }}>
          Her buton için bir çıkış handle&apos;ı oluşturulur
        </Typography>

        {buttons.map((button, index) => (
          <Grid container spacing={2} key={button.id || index} style={{ marginBottom: "12px" }}>
            <Grid item xs={5}>
              <TextField
                fullWidth
                size="small"
                label="Buton Label"
                value={button.label || ""}
                onChange={(e) => handleButtonChange(index, "label", e.target.value)}
                placeholder="Buton adı"
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                fullWidth
                size="small"
                label="Action Code"
                value={button.action || ""}
                onChange={(e) => handleButtonChange(index, "action", e.target.value)}
                placeholder="APPROVE, REJECT, vb."
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton
                color="error"
                onClick={() => handleDeleteButton(index)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <MDButton
          variant="outlined"
          color="info"
          size="small"
          onClick={handleAddButton}
          startIcon={<AddIcon />}
          style={{ marginBottom: "16px" }}
        >
          Buton Ekle
        </MDButton>

        <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
          <Button design="Emphasized" onClick={handleSave}>
            Kaydet
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default UserTaskTab;

