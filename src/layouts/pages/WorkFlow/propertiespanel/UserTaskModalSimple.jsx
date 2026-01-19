import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  IconButton,
  Autocomplete,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";
import {
  Paper,
  Chip,
} from "@mui/material";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import { UserApi } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

/**
 * ✅ Basit UserTask Modal Component
 * 
 * Özellikler:
 * - Görev adı
 * - Kullanıcı atama (Autocomplete ile arama)
 * - Kullanıcıya gösterilecek mesaj
 */

const UserTaskModalSimple = ({ open, onClose, initialValues, node, onSave }) => {
  const [name, setName] = useState(initialValues?.name || "Kullanıcı Görevi");
  const [searchByName, setSearchByName] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState(initialValues?.message || "");
  const [inputValue, setInputValue] = useState("");
  const dispatchBusy = useBusy();

  // Kullanıcıları otomatik yükle (modal açıldığında)
  useEffect(() => {
    const loadInitialUsers = async () => {
      if (!open) return;
      
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new UserApi(conf);
        const data = await api.apiUserGetAllUsersWithNameNameGet("*");
        const pureData = data?.data || [];
        setSearchByName(pureData);
      } catch (error) {
        console.error("Kullanıcılar yüklenirken hata:", error);
        setSearchByName([]);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    if (open) {
      loadInitialUsers();
    } else {
      setSearchByName([]);
    }
  }, [open, dispatchBusy]);

  // Initial values değiştiğinde state'i güncelle
  useEffect(() => {
    if (open && initialValues) {
      setName(initialValues.name || "Kullanıcı Görevi");
      if (initialValues.userId || initialValues.userName) {
        setSelectedUser({
          id: initialValues.userId,
          userName: initialValues.userName,
          firstName: initialValues.userFirstName,
          lastName: initialValues.userLastName,
        });
        if (initialValues.userFirstName && initialValues.userLastName) {
          setInputValue(`${initialValues.userFirstName} ${initialValues.userLastName}`);
        } else if (initialValues.userName) {
          setInputValue(initialValues.userName);
        }
      } else {
        setSelectedUser(null);
        setInputValue("");
      }
      if (initialValues.message) {
        setMessage(initialValues.message);
      }
    } else if (!open) {
      setInputValue("");
      setSearchByName([]);
    }
  }, [open, initialValues]);

  // Kullanıcı arama
  const handleSearchByName = async (value) => {
    if (!value || value.trim() === "") {
      return;
    }
    
    dispatchBusy({ isBusy: true });
    try {
      const conf = getConfiguration();
      const api = new UserApi(conf);
      const data = await api.apiUserGetAllUsersWithNameGet(value.trim());
      const pureData = data?.data || [];
      setSearchByName(pureData);
    } catch (error) {
      console.error("Kullanıcı arama hatası:", error);
      setSearchByName([]);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // Kaydet
  const handleSave = () => {
    if (!selectedUser) {
      alert("Lütfen bir kullanıcı seçin");
      return;
    }

    // Approve ve Reject butonları - Her zaman var
    const buttons = [
      {
        id: "approve",
        label: "Onayla",
        action: "APPROVE",
        type: "primary",
      },
      {
        id: "reject",
        label: "Reddet",
        action: "REJECT",
        type: "default",
      },
    ];

    const taskData = {
      name,
      userId: selectedUser.id || selectedUser.userAppId,
      userName: selectedUser.userName,
      userFirstName: selectedUser.firstName,
      userLastName: selectedUser.lastName,
      assignedUserName: selectedUser.firstName && selectedUser.lastName
        ? `${selectedUser.firstName} ${selectedUser.lastName}`
        : selectedUser.userAppName || selectedUser.userName,
      message,
      buttons,
    };

    if (onSave && node) {
      onSave({
        id: node.id,
        data: taskData,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Kullanıcı Görevi Ayarları</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Görev Adı */}
          <Box mb={3}>
            <MDInput
              label="Görev Adı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Kullanıcı Seçimi */}
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Atanacak Kullanıcı
            </Typography>
            <Autocomplete
              options={searchByName}
              getOptionLabel={(option) => {
                if (option.firstName && option.lastName) {
                  return `${option.firstName} ${option.lastName}`;
                }
                return option.userAppName || option.userName || "";
              }}
              value={selectedUser}
              inputValue={inputValue}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                return (
                  option.id === value.id ||
                  option.id === value.userAppId ||
                  option.userAppId === value.id
                );
              }}
              onChange={(event, newValue) => {
                setSelectedUser(newValue);
                if (newValue) {
                  setInputValue(newValue.firstName && newValue.lastName
                    ? `${newValue.firstName} ${newValue.lastName}`
                    : newValue.userAppName || newValue.userName || "");
                }
              }}
              onInputChange={(event, newInputValue, reason) => {
                setInputValue(newInputValue);
                if (reason === "input" && newInputValue.trim().length > 0) {
                  handleSearchByName(newInputValue);
                } else if (reason === "clear" || newInputValue.trim().length === 0) {
                  setSearchByName([]);
                }
              }}
              renderInput={(params) => (
                <MDInput
                  {...params}
                  label="Kullanıcı ara..."
                  placeholder="Kullanıcı adı veya email ile ara"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id || option.userAppId}>
                  <Box>
                    <Typography fontWeight={600}>
                      {option.firstName && option.lastName
                        ? `${option.firstName} ${option.lastName}`
                        : option.userAppName || option.userName}
                    </Typography>
                    {option.email && (
                      <Typography variant="caption" color="textSecondary">
                        {option.email}
                      </Typography>
                    )}
                    {option.userName && (
                      <Typography variant="caption" color="textSecondary">
                        @{option.userName}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Mesaj Alanı */}
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              <MessageIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Kullanıcıya Gösterilecek Mesaj
            </Typography>
            <TextField
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Kullanıcıya gösterilecek mesajı buraya yazın..."
              fullWidth
              helperText="Bu mesaj kullanıcıya görev gösterildiğinde görüntülenecektir"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Çıkış Butonları Bilgisi */}
          <Box mb={2}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Çıkış Butonları
            </Typography>
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ApproveIcon color="success" />
                  <Typography fontWeight={600}>Onayla</Typography>
                  <Chip
                    label="APPROVE"
                    size="small"
                    color="success"
                    sx={{ height: "20px", fontSize: "0.7rem" }}
                  />
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <RejectIcon color="error" />
                  <Typography fontWeight={600}>Reddet</Typography>
                  <Chip
                    label="REJECT"
                    size="small"
                    color="error"
                    sx={{ height: "20px", fontSize: "0.7rem" }}
                  />
                </Box>
              </Box>
            </Paper>
            <Box mt={1}>
              <Typography variant="caption" color="textSecondary">
                Her zaman 2 çıkış handle&apos;ı oluşturulacaktır (Onayla ve Reddet)
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <MDButton variant="outlined" color="secondary" onClick={onClose}>
          İptal
        </MDButton>
        <MDButton variant="gradient" color="info" onClick={handleSave}>
          Kaydet
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

export default UserTaskModalSimple;

