import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  styled,
} from '@mui/material';
import router from 'next/router';
import { X } from 'phosphor-react';
import React from 'react';
import { Form } from 'react-final-form';

import { useAppSelector } from '@/hooks/useReduxHooks';

import CustomizedButton from '@/components/Utility/CustomizedButton';

import { deleteSite } from '@/action/site';

import adminStyles from '@/styles/sass/pages/AdminDashboard.module.scss';
interface IProps {
  isVisible: boolean;
  onClose: () => void;
  siteId: any;
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
function DeleteSiteDialog(props: IProps) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const { token } = useAppSelector((state) => ({
    token: state.authState.token,
  }));

  const onFormSubmit = async (values: any) => {
    setLoading(true);
    const result = await deleteSite(props.siteId, token as string);
    if (result) {
      props.onClose();
      router.push('dashboard');
    }

    setLoading(false);
  };

  return (
    <StyledDialog
      className={adminStyles.lenderDialogStyle}
      open={props.isVisible}
      onClose={props.onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle className={adminStyles.dialogTitle} id="alert-dialog-title">
        <p style={{ margin: '0' }}>Delete Site</p>
        <IconButton onClick={props.onClose}>
          <X size={24} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Form
          onSubmit={onFormSubmit}
          className={adminStyles.formStyle}
          render={({ handleSubmit, valid, values }) => (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <h4>Are you sure you want to delete?</h4>
              </div>
              <div className={adminStyles.submitBtnContainer}>
                <CustomizedButton
                  isLoading={loading}
                  type="submit"
                  disabled={loading}
                >
                  Delete
                </CustomizedButton>
              </div>
            </form>
          )}
        />
      </DialogContent>
    </StyledDialog>
  );
}

export default DeleteSiteDialog;
