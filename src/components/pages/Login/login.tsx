import { Button } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Field, Form } from 'react-final-form';

import CustomizedButton from '@/components/Utility/CustomizedButton';
import TextFieldInput from '@/components/Utility/TextField';

import { handleLogin } from '@/action/auth';
import { normalizeText } from '@/utils/helpers';
import validations, { composeValidators } from '@/utils/validations';

import loginStyles from '@/styles/sass/pages/login.module.scss';
import { emitNotification } from '@/lib/helper';

interface Iprops {
  next: () => void;
  setUserEmail: (email: string) => void;
  forceChangePasswordSlide: () => void;
  forgotPasswordSlide: () => void;
  setUserMsg: (msg: string) => void;
}

function LoginDetails(props: Iprops) {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const onFormSubmit = async (values: any) => {
    setLoading(true);
    const response = await handleLogin(values);
    if (response.msg === 'success') {
      setLoading(false);
      router.push('/dashboard');
      emitNotification('success', response.response.msg);
    } else {
      setLoading(false);
    }
  };

  const onForgotPassword = () => {
    props.forgotPasswordSlide();
  };

  return (
    <div className={loginStyles.main}>
      <h2 className={loginStyles.title}>Login</h2>

      <div className={loginStyles.loginContainer}>
        <Form
          onSubmit={onFormSubmit}
          render={({ handleSubmit, valid }) => (
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div className={loginStyles.inputContainer}>
                <span className={loginStyles.formElement}>
                  <InputLabel>Email</InputLabel>
                  <Field
                    component={TextFieldInput}
                    format={normalizeText}
                    type="email"
                    name="email"
                    aria-labelledby="email"
                    validate={composeValidators(
                      validations.required,
                      validations.email,
                    )}
                    InputProps={{
                      className: loginStyles.fieldInput,
                    }}
                    style={{ width: '100%' }}
                  />
                </span>
                <span className={loginStyles.formElement}>
                  <InputLabel>Password</InputLabel>
                  <Field
                    component={TextFieldInput}
                    format={normalizeText}
                    type="password"
                    name="password"
                    aria-labelledby="password"
                    validate={composeValidators(validations.required)}
                    InputProps={{
                      className: loginStyles.fieldInput,
                    }}
                    style={{ width: '100%' }}
                  />
                </span>
              </div>
              <Button
                onClick={onForgotPassword}
                className={loginStyles.textWrap}
              >
                Forgot Password?
              </Button>

              <div className={loginStyles.inputContainer}>
                <CustomizedButton
                  disabled={loading}
                  isLoading={loading}
                  type="submit"
                >
                  Login
                </CustomizedButton>
              </div>
            </form>
          )}
        />
      </div>
    </div>
  );
}
export default LoginDetails;
