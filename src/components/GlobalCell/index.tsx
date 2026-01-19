import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import React from "react";

interface rowProps {
  id?: string;
  code?: string;
  name?: string;
  category?: string;
  status?: number;
}

interface Props {
  id?: string;
  checked?: boolean;
  value: any;
  testRow?: rowProps;
  columnName?: string;
  statusId?: string;
}

function GlobalCell({ value, statusId, ...rest }: Props) {
  const getStatusColor = (value: any) => {
    const colors = [
      "#607D8B", // blue grey
      "#4CAF50", // green
      "#3F51B5", // indigo
      "#2196F3", // blue
      "#9C27B0", // purple
      "#00BCD4", // cyan
      "#795548", // brown
      "#ffaa00", // orange
      "#009688", // teal
      "#E91E63", // pink
      "#df1c1a", // deep orange
    ];
    return colors[value - 1];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      // Formatla: tarih ve saat, ancak saniye yok
      const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return date.toLocaleDateString() + " " + timeString;
    } catch {
      return dateString;
    }
  };

  // Null/undefined/boş kontrolü
  if (value === null || value === undefined || value === "") {
    return (
      <MDBox display="flex" alignItems="center">
        <MDBox ml={0}>
          <MDTypography variant="caption" fontWeight="medium" color="text">
            -
          </MDTypography>
        </MDBox>
      </MDBox>
    );
  }

  return (
    <MDBox display="flex" alignItems="center">
      {typeof value == "boolean" &&
      (rest.columnName == "isActive" || rest.columnName == "showMenu") ? (
        <MDBox ml={0}>
          {/* type boolean ve columnName isActive ise active veya inactive yaz */}
          <MDTypography
            variant="caption"
            fontWeight="medium"
            color="text"
            style={{ color: value ? "#4CAF50" : "#F44336" }}
          >
            {value ? "Aktif" : "Pasif"} {/* true ise aktif, false ise pasif */}
          </MDTypography>
        </MDBox>
      ) : (
        <MDBox ml={0}>
          {rest.columnName == "createdAt" ||
          rest.columnName == "createdDate" ||
          rest.columnName == "updatedDate" ||
          rest.columnName == "workFlowItem.workflowHead.createdDate" ? (
            <MDTypography variant="caption" fontWeight="medium" color="text">
              {formatDate(value)}
            </MDTypography>
          ) : (
            <MDBox>
              {rest.columnName == "statusText" ? (
                <MDTypography
                  variant="caption"
                  fontWeight="medium"
                  style={{ color: getStatusColor(statusId) }}
                >
                  {value || "-"}
                </MDTypography>
              ) : (
                <MDTypography variant="caption" fontWeight="medium" color="text">
                  {value || "-"}
                </MDTypography>
              )}
            </MDBox>
          )}
        </MDBox>
      )}
    </MDBox>
  );
}

export default GlobalCell;
