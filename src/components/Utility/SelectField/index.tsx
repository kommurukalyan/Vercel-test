import { FormControl, FormHelperText, Select } from '@mui/material';

/**
 * Select component for "Field" in react-final-form
 *
 * @param {any} props Select field Props
 * @returns {any} Select Field
 */
export function SelectFieldInput(props: any) {
  const {
    input: { name, onChange, value, ...restInput },
    meta,
    formControlProps,
    selectProps,

    label,
    formValues,
    ...rest
  } = props;
  // eslint-disable-next-line max-len
  const showError =
    ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) &&
    meta.touched;

  return (
    <FormControl
      {...formControlProps}
      sx={{ minWidth: { xs: '100%', sm: '100%' }, minHeight: '44px' }}
      error={showError}
    >
      <Select
        {...rest}
        name={name}
        error={showError}
        inputProps={restInput}
        MenuProps={{
          disableScrollLock: true,
        }}
        onChange={(e) => {
          onChange(e);
          if (rest.secondaryFunction) {
            rest.secondaryFunction(e.target.value);
          }
          if (rest.additionalOnClickFunction) {
            rest.additionalOnClickFunction(formValues);
          }
        }}
        onOpen={(_e) => {
          if (rest.onOpenFunction) {
            rest.onOpenFunction();
          }
        }}
        value={value}
        {...selectProps}
      />
      {showError && (
        <FormHelperText sx={{ marginLeft: 0 }}>
          {meta.error || meta.submitError}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default SelectFieldInput;
