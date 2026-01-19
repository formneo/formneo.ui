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

import checkout from "layouts/pages/users/new-user/schemas/form";

let {
  formField: {
    userName,
    firstName,
    lastName,
    company,
    email,
    password,
    department, // Yeni eklenen alan
    title, // Yeni eklenen alan
    linkedinUrl, // Yeni eklenen alan
    cv, // Yeni eklenen alan
    skills, // Yeni eklenen alan
    token, // Yeni eklenen alan
    isBlocked, // Yeni eklenen alan
    isTestData, // Yeni eklenen alan
    vacationMode,
    isSystemAdmin,
    profileInfo,
    photo,
    canSsoLogin,
    sapDepartmentText,
    sapPositionText, // Yeni eklenen alan
    roleIds, // Ticket Yetki
    isMailSender,
    positionId,
    userLevel,
    mainManagerUserAppId,
    pCname,
  },
} = checkout;


// Tür tanımı
type InitialValuesType = {
  [key: string]: string | boolean | null | any[] | number;
};

let initialValues: InitialValuesType = {
  [userName.name]: "",
  [firstName.name]: "",
  [lastName.name]: "",
  [company.name]: "",
  [email.name]: "",
  [password.name]: "",
  [department.name]: "", // Yeni alan
  [title.name]: "", // Yeni alan
  [linkedinUrl.name]: "", // Yeni alan
  [cv.name]: null, // Yeni alan, başlangıç değeri null olabilir
  [skills.name]: [], // Yeni alan, başlangıç değeri boş bir array
  [token.name]: "", // Yeni alan
  [isBlocked.name]: false, // Yeni alan, başlangıç değeri false
  [isTestData.name]: false, // Yeni alan, başlangıç değeri false
  [vacationMode.name]: false,
  [profileInfo.name]: "",// Yeni alan, başlangıç değeri false
  [isSystemAdmin.name]: false,// Yeni alan, başlangıç değeri false,
  [photo.name]: "",
  [canSsoLogin.name]: false,
  [roleIds.name]: [],
  [isMailSender.name]: false,
  [positionId.name]: null,
  [userLevel.name]: null,
  [mainManagerUserAppId.name]: null,
};


export default initialValues;
