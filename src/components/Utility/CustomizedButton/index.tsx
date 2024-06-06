import {
  Button as MuiButton,
  ButtonProps,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Customized Mui button comp
 *
 */

const Button = styled(MuiButton)`
  background: orangered;
  border-radius: 6px;
  padding: 12px 24px;
  width: 288px !important;
  height: 44px;
  color: white;
  box-shadow: 0px 12.116715431213379px 24.233430862426758px 0px
    rgba(1, 11, 253, 0.12);
  :hover {
    background: white;
    color: orangered;
    border: 1px solid orangered;
  }
  :disabled {
    background: rgba(0, 0, 0, 0.2);
  }
  '&.small' {
    width: 180px !important;
  }
  @media (max-width: 949px) {
    width: 280px !important;
    text-wrap: nowrap;
  }
  @media (max-width: 560px) {
    width: 100% !important;
  }
`;

interface IButton extends ButtonProps {
  isLoading?: boolean;
  children?: any;
}

const customizedButton = ({ isLoading, children, ...buttonProps }: IButton) => {
  return (
    <Button role="button" {...buttonProps}>
      {isLoading ? <CircularProgress size={18} /> : children}
    </Button>
  );
};

export default customizedButton;
