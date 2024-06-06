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
  background: #005a9e;
  border-radius: 6px;
  padding: 12px 24px 12px 16px;
  width: 182px;
  height: 44px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  :hover {
    background: #005290;
    color: white;
  }
  :disabled {
    background: rgba(0, 0, 0, 0.2);
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

const CustomizedBlueButton = ({
  isLoading,
  children,
  ...buttonProps
}: IButton) => {
  return (
    <Button role="button" {...buttonProps}>
      {isLoading ? <CircularProgress size={18} /> : children}
    </Button>
  );
};

export default CustomizedBlueButton;
