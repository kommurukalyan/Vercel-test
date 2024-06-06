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

const CircularImportLoader = ({ loaderText }: Iprops) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <CircularLoader size={20} thickness={3} />
      <p>{loaderText}</p>
    </div>
  );
};

export default CircularImportLoader;
