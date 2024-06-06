import InputLabel from '@mui/material/InputLabel';
import React, { useState } from 'react';
import { Field, Form } from 'react-final-form';

import { useAppDispatch } from '@/hooks/useReduxHooks';

import CustomizedButton from '@/components/Utility/CustomizedButton';
import TextFieldInput from '@/components/Utility/TextField';

import { appLogout, updatePassword } from '@/action/auth';
import { normalizeText } from '@/utils/helpers';
import validations, { composeValidators } from '@/utils/validations';

import loginStyles from '@/styles/sass/pages/login.module.scss';
import { getUserToken } from '@/utils/verifyAuthentication';

function ChangePasswordForm() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>();
  const [showPassErr, setShowPassErr] = useState<boolean>(false);
  const token = getUserToken();

  const onFormSubmit = async (values: any) => {
    if (values.newpassword !== confirmPassword) {
      setShowPassErr(true);
      return;
    }
    const payload = {
      password: values.password,
      newPassword: values.newpassword,
    };
    const success = await updatePassword(payload, token as string);
    if (success) {
      setLoading(false);
      dispatch(appLogout());
    } else {
      setLoading(false);
    }
  };

  const handleConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    setShowPassErr(false);
  };
  return (
    <div className={loginStyles.main}>
      <p className="title">Change Password</p>
      <div className={loginStyles.loginContainer}>
        <Form
          onSubmit={onFormSubmit}
          render={({ handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <div className={loginStyles.inputContainer}>
                <span className={loginStyles.formElement}>
                  <InputLabel>Current Password</InputLabel>
                  <Field
                    component={TextFieldInput}
                    format={normalizeText}
                    type="password"
                    name="password"
                    validate={composeValidators(validations.required)}
                    InputProps={{
                      className: loginStyles.fieldInput,
                    }}
                  />
                </span>
                <span className={loginStyles.formElement}>
                  <InputLabel>New Password</InputLabel>
                  <Field
                    component={TextFieldInput}
                    format={normalizeText}
                    type="password"
                    name="newpassword"
                    onSecondaryFunction={(_val: string) =>
                      setShowPassErr(false)
                    }
                    validate={composeValidators(
                      validations.required,
                      validations.minPasswordLength,
                    )}
                    InputProps={{
                      className: loginStyles.fieldInput,
                    }}
                  />
                </span>
                <span className={loginStyles.formElement}>
                  <InputLabel>Confirm Password</InputLabel>
                  <Field
                    component={TextFieldInput}
                    format={normalizeText}
                    type="password"
                    name="confirmPassword"
                    onSecondaryFunction={(val: string) =>
                      handleConfirmPassword(val)
                    }
                    validate={validations.required}
                    InputProps={{
                      className: loginStyles.fieldInput,
                    }}
                  />
                  {showPassErr && (
                    <p className={loginStyles.errorText}>
                      Password does not match
                    </p>
                  )}
                </span>
              </div>

              <div className={loginStyles.inputContainer}>
                <CustomizedButton
                  disabled={loading}
                  isLoading={loading}
                  type="submit"
                >
                  Submit
                </CustomizedButton>
              </div>
            </form>
          )}
        />
      </div>
    </div>
  );
}
export default ChangePasswordForm;
