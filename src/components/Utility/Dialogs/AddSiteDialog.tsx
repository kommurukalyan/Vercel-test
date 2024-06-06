import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  styled,
} from '@mui/material';
import { isEmpty } from 'lodash';
import { X } from 'phosphor-react';
import React from 'react';
import { Field, Form } from 'react-final-form';

import { useAppSelector } from '@/hooks/useReduxHooks';

import CustomizedButton from '@/components/Utility/CustomizedButton';
import TextFieldInput from '@/components/Utility/TextField';

import { createSite } from '@/action/site';
import { frameEditUserInitialValues } from '@/utils/helpers';
import validations from '@/utils/validations';

import adminStyles from '@/styles/sass/pages/AdminDashboard.module.scss';
import ImportDataDialog from './ImportDataDialog';
import { emitErrorNotification, emitNotification } from '@/lib/helper';

interface IProps {
  initialValues: any;
  // eslint-disable-next-line react/no-unused-prop-types
  editMode: any;
  isVisible: boolean;
  onClose: () => void;
  fetchData: () => void;
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
function AddSiteDialog(props: IProps) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isImportDialogVisible, setIsImportDialogVisible] =
    React.useState<boolean>(false);
  const [importData, setImportData] = React.useState([]);
  const { token } = useAppSelector((state) => ({
    token: state.authState.token,
  }));
  const closeDialog = () => {
    props.fetchData();
  };
  const onFormSubmit = async (values: any) => {
    setLoading(true);
    const valuesToSend = { ...values };
    const result = await createSite(valuesToSend, token as string);
    setLoading(true);
    if (!result.error) {
      setLoading(false);
      props.onClose();
      props.fetchData();
      emitNotification('success', result.msg);
    }
    else{
      setLoading(false)
      emitErrorNotification(result.msg)
    }
  };

  return (
    <>
      {!isImportDialogVisible ? (
        <StyledDialog
          className={adminStyles.lenderDialogStyle}
          open={props.isVisible}
          onClose={props.onClose}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle
            className={adminStyles.dialogTitle}
            id="alert-dialog-title"
          >
            <p style={{ margin: '0' }}>Add site</p>
            <IconButton onClick={props.onClose}>
              <X size={24} />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Form
              onSubmit={onFormSubmit}
              className={adminStyles.formStyle}
              initialValues={
                !isEmpty(props.initialValues)
                  ? frameEditUserInitialValues(props.initialValues)
                  : {}
              }
              render={({ handleSubmit, valid, values }) => (
                <form onSubmit={handleSubmit}>
                  <div className={adminStyles.formElements}>
                    <span className={adminStyles.formElement}>
                      <Field
                        component={TextFieldInput}
                        name="siteId"
                        type="text"
                        placeholder="SiteId"
                        validate={validations.required}
                        InputProps={{
                          className: adminStyles.fieldInput,
                        }}
                        style={{ width: '100%' }}
                      />
                    </span>
                    <span className={adminStyles.formElement}>
                      <Field
                        component={TextFieldInput}
                        name="locationUuid"
                        type="text"
                        placeholder="LocationUuId"
                        validate={validations.required}
                        InputProps={{
                          className: adminStyles.fieldInput,
                        }}
                        style={{ width: '100%' }}
                      />
                    </span>
                    <span className={adminStyles.formElement}>
                      <Field
                        component={TextFieldInput}
                        name="locationName"
                        type="text"
                        placeholder="Location Name"
                        validate={validations.required}
                        InputProps={{
                          className: adminStyles.fieldInput,
                        }}
                        style={{ width: '100%' }}
                      />
                    </span>
                    <span className={adminStyles.formElement}>
                      <Field
                        component={TextFieldInput}
                        name="apiKey"
                        type="text"
                        placeholder="Api Key"
                        validate={validations.required}
                        InputProps={{
                          className: adminStyles.fieldInput,
                        }}
                        style={{ width: '100%' }}
                      />
                    </span>
                  </div>
                  <div className={adminStyles.submitBtnContainer}>
                    <CustomizedButton
                      isLoading={loading}
                      type="submit"
                      disabled={loading}
                    >
                      Add
                    </CustomizedButton>
                  </div>
                </form>
              )}
            />
          </DialogContent>
        </StyledDialog>
      ) : (
        <ImportDataDialog
          isVisible={isImportDialogVisible}
          onClose={closeDialog}
          data={importData}
        />
      )}
    </>
  );
}

export default AddSiteDialog;
