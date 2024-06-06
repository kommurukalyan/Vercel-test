import InfoIcon from '@mui/icons-material/Info';
import {
  styled,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import React from 'react';

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: 12,
    maxWidth: 520,
  },
}));

const StyledTableCell = styled(TableCell)`
  background-color: #f8f9fd;
  font-size: 14px;
  font-weight: 700;
  color: '#2C2D30';
`;

interface Iprops {
  columns: Array<{
    currency?: boolean;
    date?: boolean;
    disablePadding?: boolean;
    key: string;
    label: string;
    numeric?: boolean;
    boolean?: boolean;
  }>;
  onRequestSort: (event: any, property: any) => void;
  order: any;
  orderBy: string;
  editAtStart?: boolean;
  editAtLast?: boolean;
  forceCenterAlign: boolean | undefined;
  disableSort?: boolean;
  equalSpacing?: boolean;
  enableCheckbox?: boolean;
}

/**
 * Table head component
 *
 * @param {Iprops} props component props
 * @returns {JSX} returns jsx component
 */
function AdminTableHead(props: Iprops) {
  const {
    columns,
    order,
    orderBy,
    editAtStart,
    editAtLast,
    forceCenterAlign,
    disableSort,
    equalSpacing,
    onRequestSort,

    enableCheckbox,
  } = props;

  const headWidth = !equalSpacing ? 'auto' : `calc(100% / ${columns.length})`;

  const createSortHandler = (property: any) => (event: any) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {editAtStart && <StyledTableCell />}
        {/* {enableCheckbox && (
          <StyledTableCell align="center" padding="checkbox">
            <Checkbox
              color="primary"
              onChange={(_, checked: boolean) => onSelectAllClick(checked)}
              style={{ padding: 5 }}
              inputProps={{
                'aria-label': 'select all desserts',
              }}
            />
          </StyledTableCell>
        )} */}

        {columns
          .filter(function (r: any) {
            if (r.hideColumn) {
              return false;
            }
            return true;
          })
          .map((column, index) => (
            <StyledTableCell
              // eslint-disable-next-line react/no-array-index-key
              key={`${column.key}-${index}`}
              style={{
                width: headWidth,
              }}
              align={
                index === 0 ? 'left' : forceCenterAlign ? 'center' : 'left'
              }
              padding={column.disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === column.key ? order : false}
            >
              {disableSort ? (
                column.label
              ) : column.label === 'Scope' ? (
                <LightTooltip
                  title={
                    <span>
                      <p>
                        <strong>E</strong> - Exterior pics only
                      </p>
                      <p>
                        <strong>E/I</strong> - Exterior & Interior pics only
                      </p>
                    </span>
                  }
                  placement="top-start"
                >
                  <p style={{ display: 'flex' }}>
                    {column.label}{' '}
                    <InfoIcon
                      fontSize="small"
                      style={{ width: '22px', margin: '0 0 -6px 3px' }}
                    ></InfoIcon>
                  </p>
                </LightTooltip>
              ) : column.label === 'Status' ? (
                <p>
                  {column.label}{' '}
                  <LightTooltip
                    title={
                      <div>
                        <p>
                          <strong>Exterior Pics Start</strong> - Exterior pics
                          ready to be captured
                        </p>
                        <p>
                          <strong>Exterior in Progress</strong> - Exterior room
                          pics are being captured
                        </p>
                        <p>
                          <strong>Exterior Completed</strong> - Exterior room
                          pics capture process completed
                        </p>
                        <p>
                          <strong>Interior Pics Start</strong> - Interiorr pics
                          ready to be captured
                        </p>
                        <p>
                          <strong>Interior in Progress</strong> - Interior room
                          pics are being captured
                        </p>
                        <p>
                          <strong>Interior Completed</strong> - Interior room
                          pics capture process completed
                        </p>
                        <p>
                          <strong>Sign Pending</strong> - Property sign pending
                        </p>
                        <p>
                          <strong>Submit Pending</strong> - Property submission
                          pending
                        </p>
                      </div>
                    }
                    placement="top-start"
                  >
                    <InfoIcon
                      fontSize="small"
                      style={{ width: '22px', margin: '0 0 -6px 3px' }}
                    ></InfoIcon>
                  </LightTooltip>
                </p>
              ) : (
                <Tooltip
                  title="Sort"
                  placement={column.numeric ? 'bottom-end' : 'bottom-start'}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={orderBy === column.key}
                    direction={order}
                    onClick={createSortHandler(column.key)}
                  >
                    {column.label}
                  </TableSortLabel>
                </Tooltip>
              )}
            </StyledTableCell>
          ))}
        {editAtLast && <StyledTableCell />}
      </TableRow>
    </TableHead>
  );
}

AdminTableHead.defaultProps = {
  editAtStart: false,
  editAtLast: false,
};

export default AdminTableHead;
