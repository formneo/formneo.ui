import React, { useState } from "react";
import { MenuList, MenuItem, ListItemIcon, ListItemText, Collapse } from "@mui/material";
import {
  FaBookOpen,
  FaUsers,
  FaFile,
  FaFileWord,
  FaCode,
  FaVolumeUp,
  FaArrowRight,
  FaChevronRight,
  FaChevronDown,
  FaUserCheck,
  FaGlobe,
  FaEnvelope,
  FaPlay,
  FaStop,
  FaPlug,
  FaWpforms,
  FaPencilAlt,
  FaExclamationTriangle,
  FaTasks,
} from "react-icons/fa";

const CustomMenuList = () => {
  const [open, setOpen] = useState({
    flowControl: false,
    userTasks: false,
    communication: false,
    integrations: false,
    dataScript: false,
  });

  const handleClick = (group) => {
    setOpen((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <MenuList>
      {/* 1. Akış Kontrolü */}
      <MenuItem
        onClick={() => handleClick("flowControl")}
        sx={{ bgcolor: "#1976d2", color: "common.white" }}
      >
        <ListItemIcon>
          <FaPlay style={{ color: "white" }} />
        </ListItemIcon>
        <ListItemText primary="Akış Kontrolü" />
        {open.flowControl ? (
          <FaChevronDown style={{ color: "white" }} />
        ) : (
          <FaChevronRight style={{ color: "white" }} />
        )}
      </MenuItem>
      <Collapse in={open.flowControl} timeout="auto" unmountOnExit>
        <MenuItem onDragStart={(event) => onDragStart(event, "startNode")} draggable>
          <ListItemIcon>
            <FaPlay style={{ color: "#4caf50" }} />
          </ListItemIcon>
          <ListItemText inset>Başlangıç</ListItemText>
        </MenuItem>
        <MenuItem onDragStart={(event) => onDragStart(event, "stopNode")} draggable>
          <ListItemIcon>
            <FaStop style={{ color: "#f44336" }} />
          </ListItemIcon>
          <ListItemText inset>Bitiş</ListItemText>
        </MenuItem>
        <MenuItem onDragStart={(event) => onDragStart(event, "formStopNode")} draggable>
          <ListItemIcon>
            <FaWpforms style={{ marginRight: "2px", color: "#f44336" }} />
            <FaStop style={{ color: "#f44336" }} />
          </ListItemIcon>
          <ListItemText inset>Form Bitişi</ListItemText>
        </MenuItem>
      </Collapse>

      {/* 2. Kullanıcı Görevleri */}
      <MenuItem
        onClick={() => handleClick("userTasks")}
        sx={{ bgcolor: "#9c27b0", color: "common.white" }}
      >
        <ListItemIcon>
          <FaUserCheck style={{ color: "white" }} />
        </ListItemIcon>
        <ListItemText primary="Kullanıcı Görevleri" />
        {open.userTasks ? (
          <FaChevronDown style={{ color: "white" }} />
        ) : (
          <FaChevronRight style={{ color: "white" }} />
        )}
      </MenuItem>
      <Collapse in={open.userTasks} timeout="auto" unmountOnExit>
        <MenuItem onDragStart={(event) => onDragStart(event, "userTaskNode")} draggable>
          <ListItemIcon>
            <FaUserCheck style={{ color: "#9c27b0" }} />
          </ListItemIcon>
          <ListItemText inset>Kullanıcı Görevi</ListItemText>
        </MenuItem>
        <MenuItem onDragStart={(event) => onDragStart(event, "formTaskNode")} draggable>
          <ListItemIcon>
            <FaTasks style={{ color: "#9c27b0" }} />
          </ListItemIcon>
          <ListItemText inset>Form Görevi</ListItemText>
        </MenuItem>
      </Collapse>

      {/* 3. İletişim & Bildirimler */}
      <MenuItem
        onClick={() => handleClick("communication")}
        sx={{ bgcolor: "#ff9800", color: "common.white" }}
      >
        <ListItemIcon>
          <FaEnvelope style={{ color: "white" }} />
        </ListItemIcon>
        <ListItemText primary="İletişim & Bildirimler" />
        {open.communication ? (
          <FaChevronDown style={{ color: "white" }} />
        ) : (
          <FaChevronRight style={{ color: "white" }} />
        )}
      </MenuItem>
      <Collapse in={open.communication} timeout="auto" unmountOnExit>
        <MenuItem onDragStart={(event) => onDragStart(event, "mailNode")} draggable>
          <ListItemIcon>
            <FaEnvelope style={{ color: "#ff9800" }} />
          </ListItemIcon>
          <ListItemText inset>E-posta Gönder</ListItemText>
        </MenuItem>
        <MenuItem onDragStart={(event) => onDragStart(event, "alertNode")} draggable>
          <ListItemIcon>
            <FaExclamationTriangle style={{ color: "#ff9800" }} />
          </ListItemIcon>
          <ListItemText inset>Bildirim Göster</ListItemText>
        </MenuItem>
      </Collapse>

      {/* 4. Entegrasyonlar */}
      <MenuItem
        onClick={() => handleClick("integrations")}
        sx={{ bgcolor: "#00bcd4", color: "common.white" }}
      >
        <ListItemIcon>
          <FaGlobe style={{ color: "white" }} />
        </ListItemIcon>
        <ListItemText primary="Entegrasyonlar" />
        {open.integrations ? (
          <FaChevronDown style={{ color: "white" }} />
        ) : (
          <FaChevronRight style={{ color: "white" }} />
        )}
      </MenuItem>
      <Collapse in={open.integrations} timeout="auto" unmountOnExit>
        <MenuItem onDragStart={(event) => onDragStart(event, "httpPostNode")} draggable>
          <ListItemIcon>
            <FaGlobe style={{ color: "#00bcd4" }} />
          </ListItemIcon>
          <ListItemText inset>HTTP İsteği</ListItemText>
        </MenuItem>
        <MenuItem onDragStart={(event) => onDragStart(event, "inputDataNode")} draggable>
          <ListItemIcon>
            <FaPlug style={{ color: "#00bcd4" }} />
          </ListItemIcon>
          <ListItemText inset>API Çağrısı</ListItemText>
        </MenuItem>
      </Collapse>

      {/* 5. Veri & Script İşlemleri */}
      <MenuItem
        onClick={() => handleClick("dataScript")}
        sx={{ bgcolor: "#4caf50", color: "common.white" }}
      >
        <ListItemIcon>
          <FaCode style={{ color: "white" }} />
        </ListItemIcon>
        <ListItemText primary="Veri & Script İşlemleri" />
        {open.dataScript ? (
          <FaChevronDown style={{ color: "white" }} />
        ) : (
          <FaChevronRight style={{ color: "white" }} />
        )}
      </MenuItem>
      <Collapse in={open.dataScript} timeout="auto" unmountOnExit>
        <MenuItem onDragStart={(event) => onDragStart(event, "setFieldNode")} draggable>
          <ListItemIcon>
            <FaPencilAlt style={{ color: "#4caf50" }} />
          </ListItemIcon>
          <ListItemText inset>Alan Değeri Ata</ListItemText>
        </MenuItem>
        <MenuItem onDragStart={(event) => onDragStart(event, "scriptNode")} draggable>
          <ListItemIcon>
            <FaCode style={{ color: "#4caf50" }} />
          </ListItemIcon>
          <ListItemText inset>JavaScript Kodu</ListItemText>
        </MenuItem>
      </Collapse>
    </MenuList>
  );
};

export default CustomMenuList;
