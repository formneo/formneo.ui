import React, { useEffect, useState } from "react";
import { Card, Grid } from "@mui/material";

// Proje Bileşenleri
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataGrid, { ColumnDef } from "../../components/ui/DataGrid"; 

// API Servisleri (api.ts dosyasındaki GERÇEK isimlerle güncellendi)
// import { ContactApi } from "../../api/generated/api";
import getConfiguration from "confiuration";

export default function ContactListPage(): JSX.Element {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
          try {
                // const api = new ContactApi(getConfiguration());
                // const response = await api.apiContactGetAllContactsGet();
                
                // HATA BURADAYDI: response.data'yı direkt kullanıyoruz 
                // // Eğer hata verirse (any) diyerek TypeScript'i susturuyoruz
                // const data = (response as any).data;
                // setContacts(data || []);
                
            } catch (error) {
                console.error("Mesajlar yüklenirken hata oluştu:", error);
                setContacts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, []);

    const columns: ColumnDef<any>[] = [
        {
            key: 'name',
            title: 'Ad Soyad',
            sortable: true,
            render: (value) => <MDTypography variant="caption" fontWeight="medium">{value}</MDTypography>,
            width: 200
        },
        {
            key: 'email',
            title: 'E-posta',
            render: (value) => <MDTypography variant="caption" color="text">{value}</MDTypography>,
            width: 200
        },
        {
            key: 'subject',
            title: 'Konu',
            render: (value) => (
                <MDBox component="span" px={1} py={0.5} borderRadius="md" bgcolor="info.main" color="white">
                    <MDTypography variant="caption" color="white" fontWeight="bold">{value}</MDTypography>
                </MDBox>
            ),
            width: 150
        },
        {
            key: 'message',
            title: 'Mesaj',
            render: (value) => (
                <MDTypography variant="caption" color="text" sx={{ display: 'block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value}
                </MDTypography>
            ),
            width: 300
        },
        {
            key: 'createdDate',
            title: 'Tarih',
            sortable: true,
            render: (value) => <MDTypography variant="caption" color="secondary">{value ? new Date(value).toLocaleDateString('tr-TR') : '-'}</MDTypography>,
            width: 150
        }
    ];

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <MDBox mb={3}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card>
                                <MDBox
                                    mx={2} mt={-3} py={3} px={2}
                                    variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info"
                                    display="flex" justifyContent="space-between" alignItems="center"
                                >
                                    <MDTypography variant="h6" color="white">
                                        İletişim Formu Mesajları
                                    </MDTypography>
                                </MDBox>
                                <MDBox pt={3} px={2} pb={2}>
                                    <DataGrid columns={columns} data={contacts} loading={loading} />
                                </MDBox>
                            </Card>
                        </Grid>
                    </Grid>
                </MDBox>
            </MDBox>
            <Footer />
        </DashboardLayout>
    );
}