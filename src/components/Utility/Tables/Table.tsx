/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import {
  Button,
  IconButton,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
} from '@mui/material';
import moment from 'moment';
import { useState } from 'react';

import { CheckMark, CrossMark, DeleteIcon } from '@/components/Utility/Icons';
import AdminTableHead from '@/components/Utility/Tables/TableHead';
import {
  getSorting,
  stableSort,
} from '@/components/Utility/Tables/tableHelpers';

import { normalizePhone } from '@/utils/helpers';

interface Iprops {
  rowsPerPage?: number;
  data: any[];
  tableColumns: any;
  editAtStart?: boolean;
  editAtLast?: boolean;
  onEditHandler?: (_data: any) => void;
  renderEditButton?: (_data: any) => React.ReactElement;
  forceCenterAlign?: boolean;
  disableSort?: boolean;
  onExpandHandler?: (_data: any) => void;
  hidePagination?: boolean;
  equalSpacing?: boolean;
  hideElevation?: boolean;
  enableCheckbox?: boolean;
}

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(even)': {
    backgroundColor: '#F9F3F9',
  },
}));
const StyledTableCell = styled(TableCell)(() => ({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  color: '#4D4D4D',
  borderBottom: 'none',
  '& .btnApprove': {
    fontWeight: 400,
    color: '#ffffff',
    fontSize: '12px',
    backgroundColor: '#005290',
    borderRadius: '4px',
    height: '24px',
    margin: '2px 4px',
    '&:hover': { color: '#ffffff', backgroundColor: '#005A9E' },
  },
  '& .btnReject': {
    fontWeight: 400,
    color: '#ffffff',
    fontSize: '12px',
    backgroundColor: '#FF4040',
    borderRadius: '4px',
    height: '24px',
    margin: '2px 4px',
    '&:hover': { color: '#ffffff', backgroundColor: '#FF4343' },
  },
}));

const StyledTablePagination = styled(TablePagination)(() => ({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  color: '#636363',
  borderBottom: 'none',
  '& p': {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: 400,
    color: '#636363',
    fontSize: '14px',
  },
  '& MuiTablePagination-selectRoot': {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: 400,
    color: '#636363',
    fontSize: '14px',
  },
}));

// eslint-disable-next-line react/jsx-props-no-spreading
const PlainPaper = (props: any) => <Paper {...props} elevation={0} />;
/**
 * Admin table component
 *
 * @param {Iprops} props component props
 * @returns {JSX} returns jsx component
 */
function AdminTable(props: Iprops) {
  const [order, setOrder] = useState<string>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    props.rowsPerPage || 25,
  );

  const {
    data,
    disableSort,
    editAtLast,
    editAtStart,
    equalSpacing,
    forceCenterAlign,
    hideElevation,
    hidePagination,
    tableColumns,
  } = props;

  const startIndex = page * rowsPerPage;
  let endIndex = page * rowsPerPage + rowsPerPage;
  if (rowsPerPage === -1) {
    endIndex = data.length;
  }

  const handleRequestSort = (event: any, property: any) => {
    setOrderBy(property);
    if (orderBy === property && order === 'desc') {
      setOrder('asc');
      return;
    } else {
      setOrder('desc');
    }
  };

  const handleRowsPerPageChange = (value: number) => {
    setPage(0);
    setRowsPerPage(value);
  };

  return (
    <TableContainer component={hideElevation ? PlainPaper : Paper}>
      <Table
        stickyHeader
        aria-label="Sites-Table"
        data-testid="Sites-Table"
        style={{ borderRadius: '8px' }}
      >
        <AdminTableHead
          columns={tableColumns}
          onRequestSort={(event, property) =>
            handleRequestSort(event, property)
          }
          order={order}
          orderBy={orderBy}
          editAtLast={editAtLast}
          editAtStart={editAtStart}
          forceCenterAlign={forceCenterAlign}
          disableSort={disableSort}
          equalSpacing={equalSpacing}
          enableCheckbox={props.enableCheckbox}
        />
        <TableBody>
          {stableSort(data, getSorting(order, orderBy))
            .slice(startIndex, endIndex)
            .map((n, index) => {
              const align: any = forceCenterAlign ? 'center' : 'left';
              return (
                <StyledTableRow tabIndex={index} key={n.id || n.uniqueId}>
                  {tableColumns
                    .filter(function (r: any) {
                      if (r.hideColumn) {
                        return false;
                      }
                      return true;
                    })
                    .map((r: any, i: number) => {
                      if (r.DeleteAction) {
                        return (
                          <StyledTableCell align={align} key={r.key}>
                            delete
                          </StyledTableCell>
                        );
                      }
                      if (r.createdAt) {
                        return (
                          <StyledTableCell align={align} key={r.key}>
                            {moment(n[r.key]).format('MM/DD/YY')}
                          </StyledTableCell>
                        );
                      }
                      if (r.fullName) {
                        // const isUser = n.nmlsID ? false : true;
                        return (
                          <StyledTableCell
                            key={r.key}
                            onClick={() => (r.onClick ? r.onClick(n) : null)}
                          >
                            `${n.firstName} ${n.lastName}`
                          </StyledTableCell>
                        );
                      }
                      if (r.fullNameNoClick) {
                        return (
                          <StyledTableCell key={r.key}>
                            <span>
                              {n.firstName
                                ? `${n.firstName} ${n.lastName}`
                                : '-'}
                            </span>
                          </StyledTableCell>
                        );
                      }
                      if (r.prospectFormattter) {
                        return (
                          <StyledTableCell
                            align={align}
                            key={r.key}
                            /*style={n[r.key] ? { color: 'red' } : {}}*/
                          >
                            {r.prospectFormattter(n[r.key])}
                          </StyledTableCell>
                        );
                      }
                      if (r.clickable) {
                        return (
                          <StyledTableCell
                            align={r.align || 'center'}
                            key={r.key}
                            style={{ color: '#5C53C5' }}
                          >
                            <span
                              style={{ cursor: 'pointer' }}
                              onClick={() => r.onClick(n)}
                            >
                              {n[r.key]}
                            </span>
                          </StyledTableCell>
                        );
                      }
                      if (r.formatPhone) {
                        return (
                          <StyledTableCell align={align} key={r.key}>
                            {normalizePhone(n[r.key])}
                          </StyledTableCell>
                        );
                      }

                      if (r.address) {
                        return (
                          <StyledTableCell
                            key={r.key}
                            style={{ color: '#5C53C5' }}
                          >
                            {n[r.key]}
                          </StyledTableCell>
                        );
                      }

                      if (r.paymentStatus) {
                        if (!n.paymentDone) {
                          return (
                            <StyledTableCell key={r.key}>
                              <Button
                                onClick={() => r.handleSendReminder(n.id)}
                              >
                                Send Reminder
                              </Button>
                              <Button
                                onClick={() => r.handleInvoiceReminder(n.id)}
                              >
                                Mark As Paid
                              </Button>
                            </StyledTableCell>
                          );
                        } else {
                          <StyledTableCell align={align} key={r.key}>
                            -
                          </StyledTableCell>;
                        }
                      }

                      if (r.buttonAction) {
                        return (
                          <StyledTableCell align={align} key={`${r.key}-${i}`}>
                            <IconButton onClick={() => r.deleteHandler(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </StyledTableCell>
                        );
                      }
                      if (r.space) {
                        return (
                          <StyledTableCell key={r.key}>
                            {n[r.key] ? <CheckMark /> : <CrossMark />}
                          </StyledTableCell>
                        );
                      }
                      if (r.paymentDone) {
                        return (
                          <StyledTableCell key={r.key}>
                            <Button onClick={() => r.handleSendReminder(n.id)}>
                              Send Reminder
                            </Button>
                            <Button
                              onClick={() => r.handleInvoiceReminder(n.id)}
                            >
                              Mark As Paid
                            </Button>
                          </StyledTableCell>
                        );
                      }
                      return (
                        <StyledTableCell align={align} key={r.key}>
                          {n[r.key] || '-'}
                        </StyledTableCell>
                      );
                    })}
                </StyledTableRow>
              );
            })}
        </TableBody>
        {!hidePagination && (
          <TableFooter>
            <TableRow>
              <StyledTablePagination
                rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                // className={classes.pagination}
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                backIconButtonProps={{
                  'aria-label': 'Previous Page',
                }}
                nextIconButtonProps={{
                  'aria-label': 'Next Page',
                }}
                onPageChange={(e: any, p: number) => setPage(p)}
                onRowsPerPageChange={(e: any) => {
                  handleRowsPerPageChange(e.target.value);
                }}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}

export default AdminTable;
