import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  styled,
} from '@mui/material';
import { isEmpty } from 'lodash';
import { X } from 'phosphor-react';
import React, { useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Field, Form } from 'react-final-form';

import { useAppSelector } from '@/hooks/useReduxHooks';

import CustomizedButton from '@/components/Utility/CustomizedButton';
import TextFieldInput from '@/components/Utility/TextField';

import { createSite } from '@/action/site';
import { frameEditUserInitialValues } from '@/utils/helpers';
import validations from '@/utils/validations';
import orderStyles from '@/styles/sass/pages/onboarding.module.scss';
import adminStyles from '@/styles/sass/pages/AdminDashboard.module.scss';
import CustomizedCircularLoader from '../CircularLoader';
import CircularImportLoader from '../CircularImportLoader';

interface IProps {
  isVisible: boolean;
  onClose: () => void;
  data: any;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '&.MuiDialog-paper': {
    // backgroundColor: 'Black',
  },
}));

/**
 * Approve AMC Dialog Box
 *
 * @param {IProps} props component props
 * @returns {JSX} returns jsx
 */
function ImportDataDialog(props: IProps) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [optionsMsg, setOptionsMsg] = React.useState('Importing Options');
  const [ModifiersMsg, setModifiersMsg] = React.useState('Importing Modifiers');
  const [variantsMsg, setVariantsMsg] = React.useState('Importing Variants');
  const [productsMsg, setProductsMsg] = React.useState('Importing Products');
  const [categoriesMsg, setcategoriesMsg] = React.useState(
    'Importing Categories',
  );
  const [menusMsg, setmenusMsg] = React.useState('Importing menus');
  const [OptionsVisible, setOptionsVisible] = React.useState(false);
  const [variantsVisible, setVariantsVisible] = React.useState(false);
  const [modifiersVisible, setModifiersVisible] = React.useState(false);
  const [productsVisible, setProductsVisible] = React.useState(false);
  const [categoriesVisible, setCategoriesVisible] = React.useState(false);
  const [menusVisible, setMenusVisible] = React.useState(false);
  const [btnVisible, setBtnVisible] = React.useState(true);

  useEffect(() => {
    const optionstimeout = setTimeout(() => {
      setOptionsVisible(true);
      setOptionsMsg('Options Imported Successfully');
      return () => clearTimeout(optionstimeout);
    }, 1000);
  }, []);
  useEffect(() => {
    const modifierstimeout = setTimeout(() => {
      setModifiersVisible(true);
      setModifiersMsg('Modifiers Imported Successfully');
      return () => clearTimeout(modifierstimeout);
    }, 2000);
  }, []);
  useEffect(() => {
    const variantstimeout = setTimeout(() => {
      setVariantsVisible(true);
      setVariantsMsg('Variants Imported Successfully');
      return () => clearTimeout(variantstimeout);
    }, 3000);
  }, []);
  useEffect(() => {
    const productstimeout = setTimeout(() => {
      setProductsVisible(true);
      setProductsMsg('Products Imported Successfully');
      return () => clearTimeout(productstimeout);
    }, 4000);
  }, []);
  useEffect(() => {
    const categoriestimeout = setTimeout(() => {
      setCategoriesVisible(true);
      setcategoriesMsg('Categories Imported Successfully');
      return () => clearTimeout(categoriestimeout);
    }, 5000);
  }, []);
  useEffect(() => {
    const menustimeout = setTimeout(() => {
      setMenusVisible(true);
      setmenusMsg('Menus Imported Successfully');
      setBtnVisible(false);
    }, 6000);
    return () => clearTimeout(menustimeout);
  }, []);

  return (
    <StyledDialog
      className={adminStyles.lenderDialogStyle}
      open={props.isVisible}
      onClose={props.onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle className={adminStyles.dialogTitle} id="alert-dialog-title">
        <p style={{ margin: '0', alignItems: 'center' }}>Importing Data</p>
        <IconButton onClick={props.onClose}>
          <X size={24} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {!OptionsVisible ? (
            <CircularImportLoader loaderText={optionsMsg} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircleIcon fontSize="medium" color="success" />
              <p>{optionsMsg}</p>
            </div>
          )}
          {!modifiersVisible ? (
            <CircularImportLoader loaderText={ModifiersMsg} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircleIcon fontSize="medium" color="success" />
              <p>{ModifiersMsg}</p>
            </div>
          )}
          {!variantsVisible ? (
            <CircularImportLoader loaderText={variantsMsg} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircleIcon fontSize="medium" color="success" />
              <p>{variantsMsg}</p>
            </div>
          )}
          {!productsVisible ? (
            <CircularImportLoader loaderText={productsMsg} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircleIcon fontSize="medium" color="success" />
              <p>{productsMsg}</p>
            </div>
          )}
          {!categoriesVisible ? (
            <CircularImportLoader loaderText={categoriesMsg} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircleIcon fontSize="medium" color="success" />
              <p>{categoriesMsg}</p>
            </div>
          )}
          {!menusVisible ? (
            <CircularImportLoader loaderText={menusMsg} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircleIcon fontSize="medium" color="success" />
              <p>{menusMsg}</p>
            </div>
          )}
          <div style={{ alignSelf: 'center' }}>
            <button
              className={orderStyles.addButton}
              onClick={props.onClose}
              disabled={btnVisible}
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </StyledDialog>
  );
}

export default ImportDataDialog;
