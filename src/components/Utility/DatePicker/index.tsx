import { TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import dayjs from 'dayjs';
import { useState } from 'react';
interface Props {
  input: any;
  meta: any;
  [x: string]: any;
  InputProps: any;
  handleDateValid?: (ok: boolean) => void;
}
/**
 * DatePicker for "Field" in react-final-form
 *
 * @param {any} props Date Picker Props
 * @returns {any} DatePicker,
 */
export default function DatePickerWrapper(props: Props) {
  const {
    input: { name, onChange, value, ...restInput },
    meta,
    dateProps,
  } = props;
  const [dateError, setDateError] = useState<string | null>(null);
  const showError =
    ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) &&
    meta.touched;
  const handleError = (error: string | null) => {
    setDateError(error);
  };
  const handleChange = (dateValue: any) => {
    onChange(dateValue);
    const isError = dayjs(dateValue).isValid();
    const isFutureDate = dayjs(dateValue).isAfter(new Date());
    if (props.handleDateValid) {
      props.handleDateValid(isError || isFutureDate ? true : false);
    }
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesktopDatePicker
        data-testid="date-picker"
        name={name}
        error={showError}
        inputProps={restInput}
        onChange={handleChange}
        renderInput={(params: any) => (
          <TextField
            sx={{ backgroundColor: 'white' }}
            helperText={
              dateError
                ? 'Invalid date'
                : showError
                  ? meta.error || meta.submitError
                  : undefined
            }
            {...params}
            inputProps={{
              ...params.inputProps,
            }}
          />
        )}
        value={value === '' ? null : value}
        onError={handleError}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...dateProps}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    </LocalizationProvider>
  );
}
