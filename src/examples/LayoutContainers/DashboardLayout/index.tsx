/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, ReactNode, useState } from "react";

// react-router-dom components

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import AppActionBar from "components/ui/AppActionBar";

// Material Dashboard 2 PRO React context
import { useMaterialUIController, setLayout } from "context";
import { useLocation } from "react-router-dom";
 
function DashboardLayout({ children }: { children: ReactNode }): JSX.Element {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav } = controller;
  const { pathname } = useLocation();

  useEffect(() => {
    setLayout(dispatch, "dashboard");
  }, [pathname]);

  

  return (
    <MDBox
      sx={({ breakpoints, transitions, functions: { pxToRem } }) => ({
        px: 3,
        pb: 3,
        pt: 0,
        position: "relative",
        overflowX: "hidden",

        [breakpoints.up("xl")]: {
          marginLeft: 0,
          transition: transitions.create(["margin-left", "margin-right"], {
            easing: transitions.easing.easeInOut,
            duration: transitions.duration.standard,
          }),
        },
      })}
    >
      <AppActionBar />
      {children}
    </MDBox>
  );
}

export default DashboardLayout;
