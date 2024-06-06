import { CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const CircularLoader = styled(CircularProgress)`
  & .MuiCircularProgress-svg {
    stroke: 'red';
  }
`;

interface Iprops {
  loaderText?: string;
}

const CustomizedCircularLoader = ({ loaderText }: Iprops) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <CircularLoader size={60} thickness={3} />
      <p>{loaderText}</p>
    </div>
  );
};

export default CustomizedCircularLoader;
