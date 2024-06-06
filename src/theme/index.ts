import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';
import { Poppins } from 'next/font/google';

export const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Roboto'],
});

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#005A9E',
      light: '#556cd6',
      dark: '#005290',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2B445A',
    },
    error: {
      main: red.A400,
    },
    text: {
      primary: '#2B445A',
      secondary: '#005A9E',
      disabled: 'rgba(60, 72, 88, 0.38)',
    },
  },
  typography: {
    fontSize: 16,
    htmlFontSize: 16,
    fontFamily: poppins.style.fontFamily,

    h1: {
      fontWeight: 500,
      fontSize: '3rem',
      lineHeight: `${4 / 3}em`,
      color: '#005A9E',
      letterSpacing: `-${1.5 / 48}em`,
      fontFamily: poppins.style.fontFamily,
    },
    h2: {
      fontFamily: poppins.style.fontFamily,
      fontSize: '2.25rem',
      fontWeight: 500,
      color: '#2B445A',
      lineHeight: '1.5em',
      letterSpacing: `-${0.5 / 36}em`,
    },
    h3: {
      fontFamily: poppins.style.fontFamily,
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#2B445A',
      lineHeight: '1.5em',
    },
    h4: {
      fontFamily: poppins.style.fontFamily,
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#2B445A',
      lineHeight: `${32 / 20}`,
      letterSpacing: `${0.25 / 20}em`,
    },
    h5: {
      fontFamily: poppins.style.fontFamily,
      fontSize: '1rem',
      fontWeight: 500,
      color: '#2B445A',
      lineHeight: '1.5em',
    },
    h6: {
      fontFamily: poppins.style.fontFamily,
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#2B445A',
      lineHeight: `${20 / 12}em`,
      letterSpacing: `${0.15 / 12}em`,
    },
    body1: {
      fontFamily: poppins.style.fontFamily,
      fontSize: '0.875rem',
      fontWeight: 'normal',
      color: '#2B445A',
      lineHeight: `${20 / 12}em`,
      letterSpacing: `${0.15 / 12}em`,
    },
    body2: {
      fontFamily: poppins.style.fontFamily,
      fontSize: '0.875rem',
      fontWeight: 'normal',
      color: 'rgba(43, 68, 90, 0.5)',
      lineHeight: `${20 / 12}em`,
      letterSpacing: `${0.15 / 12}em`,
    },
    subtitle1: {
      fontFamily: poppins.style.fontFamily,
      fontSize: '1rem',
      fontWeight: 'normal',
      lineHeight: '1.5em',
    },
  },
  components: {
    // Name of the component
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'capitalize' },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { borderRadius: 8 },
        input: {
          //color: '#999999',
          backgroundColor: '#ffffff',
          borderColor: '#DDDDDD',
          padding: '11.5px 23px 11.5px 11px !important',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: { marginBottom: 8 },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { borderWidth: '2px', padding: '9px 9px 9px 0px' },
        colorPrimary: {
          color: '#2B445A',
          backgroundColor: 'transparent',
          borderColor: '#2B445A',
          '&:hover': {
            backgroundColor: 'transparent',
          },
          '&.Mui-checked': {
            color: '#2B445A',
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: { borderWidth: '2px', padding: '0px 6px 6px 9px' },
        colorPrimary: {
          color: '# 2B445A',
          backgroundColor: '#fff',
          borderColor: '# 2B445A',
          '&:hover': {
            backgroundColor: 'rgba(16, 36, 254, 0.1)',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: { marginTop: '2px', alignItems: 'flex-start' },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { overflow: 'auto' },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          border: '1px solid #DDDDDD',
          borderRadius: '8px',
          overflow: 'auto',
          '& .MuiTableHead-root': {
            '& .MuiTableRow-root': {
              backgroundColor: '#F8F9FD',
              '& .MuiTableCell-root': {
                backgroundColor: '#F8F9FD',
                padding: '12px 12px',
              },
            },
          },
          '& .MuiTableBody-root': {
            '& .MuiTableRow-root': {
              '& .MuiTableCell-root': { padding: '6px 12px' },
            },
          },
          '& .MuiTableRow-head .MuiTableCell-head': {
            backgroundColor: '#F0F0F0',
            '&:first-of-type': {
              borderRadius: '8px 0 0 0',
            },
            '&:last-child': {
              borderRadius: '0 8px 0 0',
            },
          },
          '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even) .MuiTableCell-root':
            {
              backgroundColor: '#F5F5F5',
            },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiButtonBase-root': {
            //color: '#999999',
          },
          '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even) .MuiTableCell-root':
            {
              backgroundColor: '#F5F5F5',
            },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        valueLabel: {
          fontSize: '12px',
          lineHeight: 1.3,
          color: '#627293',
          top: '-30px',
          right: 0,
          padding: 0,
          backgroundColor: '#FFFFFF',
          borderRadius: '4px 4px 0px 4px',
          whiteSpace: 'normal',
          textAlign: 'right',
          '&::before': {
            background: 'none',
          },
          '&::after': {
            background: 'none',
          },
        },
        root: {
          '& .MuiSlider-thumb': {
            '&::after': {
              borderTop: '8px solid #627293',
              borderRadius: '24px',
            },
            '&:last-child': {
              '& .MuiSlider-valueLabel': {
                color: '#000',
                left: '16px',
                right: 'inherit',
                textAlign: 'left',
                borderRadius: '4px 4px 4px 0px',
              },
              '&::after': {
                borderTop: '8px solid #2C2D30',
                borderRadius: '24px',
              },
            },
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiDialogTitle-root': {
            padding: '10px 24px 8px',
            marginBottom: '16px',
            borderBottom: '1px solid #DDDDDD',
          },
        },
      },
    },
  },
});

export default theme;
