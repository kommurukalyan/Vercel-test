import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import Slide, { SlideProps } from '@mui/material/Slide';
import Snackbar from '@mui/material/Snackbar';
import React, { useEffect, useState } from 'react';

import EventEmitter from '@/lib/eventEmitter';

const SlideTransition = (props: SlideProps) => {
  return <Slide {...props} direction="up" />;
};
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  },
);

interface IState {
  open: boolean;
  severity: AlertColor | undefined;
  msg: string;
}

const initialState: IState = {
  open: false,
  severity: 'info',
  msg: '',
};
/**
 * Customized alert Snackbard
 *
 * @returns {JSX} JSX object
 */
export default function SnackbarAlert() {
  const [state, setState] = useState(initialState);

  const handleShowNotification = (payload: Partial<IState>) => {
    setState({
      open: true,
      severity: payload.severity,
      msg: payload.msg || '',
    });
  };

  useEffect(() => {
    EventEmitter.on('showNotification', handleShowNotification);
    return () => {
      EventEmitter.removeListener('showNotification', handleShowNotification);
    };
  }, []);

  const handleClose = () => {
    setState((prevState) => ({ ...prevState, open: false }));
    setTimeout(() => {
      setState(initialState);
    }, 500);
  };

  return (
    <Snackbar
      open={state.open}
      autoHideDuration={3000}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
    >
      <Alert
        onClose={handleClose}
        severity={state.severity}
        sx={{ width: '100%', fontSize: 14, fontWeight: 400 }}
      >
        {state.msg}
      </Alert>
    </Snackbar>
  );
}
