import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import clsx from 'clsx';
import { get } from 'lodash';
import { useState } from 'react';

import styles from '../../../styles/sass/Components/Forms.module.scss';

interface Props {
  input: any;
  meta: any;
  [x: string]: any;
  InputProps: any;
}

/**
 * Textfield input component from MUI with additional props
 *
 * @param {Props} props - Component props
 * @returns {any} JSX Textfield
 */
function TextFieldInput(props: Props) {
  const isError =
    (props.meta.touched && props.meta.error && props.meta.error.length > 0) ||
    (props.meta.touched &&
      props.meta.submitError &&
      props.meta.submitError.length > 0);
  const [showPassword, setShowPassword] = useState(false);

  const {
    InputProps: { className, ...restInputProps },
    ...restProps
  } = props;
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const newClassNames = clsx(className, {
    [styles.inputError]: isError,
    [styles.inputDefault]: !isError,
  });

  return (
    <TextField
      error={isError}
      helperText={
        (props.meta.touched && props.meta.error) || props.meta.submitError
      }
      {...props.input}
      onChange={(event: any) => {
        props.input.onChange(event.target.value);
        if (props.onSecondaryFunction) {
          props.onSecondaryFunction(event.target.value);
        }
      }}
      value={get(props, 'input.value', '')}
      // eslint-disable-next-line react/jsx-props-no-spreading
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...restProps}
      InputProps={{
        endAdornment:
          props.input.type === 'password' ? (
            <InputAdornment position="end">
              <IconButton onClick={handleClickShowPassword}>
                {showPassword ? (
                  <Visibility style={{ color: '#627293' }} />
                ) : (
                  <VisibilityOff style={{ color: '#627293' }} />
                )}
              </IconButton>
            </InputAdornment>
          ) : null,
        ...restInputProps,
        type:
          props.input.type !== 'password'
            ? props.input.type
            : showPassword
              ? 'text'
              : 'password',
        className: newClassNames,
      }}
      FormHelperTextProps={{ style: { marginLeft: 0, marginRight: 0 } }}
    />
  );
}

TextFieldInput.defaultProps = {
  InputProps: {
    disableUnderline: true,
  },
};

export default TextFieldInput;
