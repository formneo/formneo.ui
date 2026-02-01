import React from 'react';
import PropTypes from 'prop-types';
import { Box, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Form } from "formik";
import { ErrorMessage, Field, Formik, FormikProvider, useFormik } from "formik";
import { Button, Input } from '@ui5/webcomponents-react';
import { Dropdown } from 'primereact/dropdown';
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};



const types = [
  { name: 'Süreci Bitir', code: 'FINISH' },
  { name: 'Yeniden Başlat', code: 'RESTART' },
];

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function StopTab({ initialValues, node, onButtonClick }) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {

    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Genel" {...a11yProps(0)} />
          <Tab label="Aksiyon" {...a11yProps(1)} />
          {/* <Tab label="Item Three" {...a11yProps(2)} /> */}
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Formik
          initialValues={initialValues}
          onSubmit={(values, { setSubmitting }) => {

            

            node.data = values;
            setSubmitting(false);
            onButtonClick(node);
          }}
        >
          {({ submitForm, isSubmitting, handleChange, values }) => (
            <Form>



              <div style={{ display: 'flex', gap: '1rem' }}>
                <Dropdown
                  value={values.stoptype ? values.stoptype : undefined}
                  onChange={handleChange}
                  options={types}
                  name='stoptype'
                  optionLabel="name"
                  placeholder="Durma Tipi Seçiniz"
                />

                <Field
                  as={TextField}
                  name="name"
                  label="Akış Adı"
                  fullWidth
                  onChange={handleChange}
                  value={values.name}
                />
              </div>

              <Field
                as={TextField}
                name="name"
                label="Method Adı"
                fullWidth
                onChange={handleChange}
                value={values.methodname}
              />
              <Button style={{ marginLeft: '10px', marginTop: '20px', marginBottom: '10px' }} type="Submit" variant="gradient" color="success" size="small">
                Kaydet
              </Button>
            </Form>
          )}
        </Formik>
      </TabPanel>
      <TabPanel value={value} index={1}>

      </TabPanel>
      {/* <TabPanel value={value} index={2}>
        Item Three
      </TabPanel> */}
    </Box>
  );
}
