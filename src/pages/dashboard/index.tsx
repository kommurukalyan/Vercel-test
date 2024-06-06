import {
  Box,
  Button,
  IconButton,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import { isEmpty } from 'lodash';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

import PageBase from '@/components/layout/PageBase';
import AddSiteDialog from '@/components/Utility/Dialogs/AddSiteDialog';
import DeleteSiteDialog from '@/components/Utility/Dialogs/DeleteSiteDialog';
import { DeleteIcon } from '@/components/Utility/Icons';
import AdminTable from '@/components/Utility/Tables/Table';

import { getSites } from '@/action/site';

import orderStyles from '@/styles/sass/pages/onboarding.module.scss';
import { useAppSelector } from '@/hooks/useReduxHooks';
import { ReplayOutlined } from '@mui/icons-material';
import RepollDialog from '@/components/Utility/Dialogs/RePollDialog';
import ErrorIcon from '@mui/icons-material/Error';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

interface Iprop {
  isDialogVisible: boolean;
  isOpen: (value: boolean) => void;
}
interface RowType {
  id: number;
  title: string;
}
const Container = SortableContainer(({ children }: any) => {
  return <TableBody>{children}</TableBody>;
});
const SortableRow = SortableElement((props: any) => {
  return <TableRow {...props} />;
});
function Dashboard(props: Iprop) {
  const [sites, setSites] = React.useState<any[]>([]);
  const [totalPages, setTotalPages] = React.useState<number>();
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [selectedRow, setSelectedRow] = React.useState<RowType | null>(null);

  const [selectedRowIndex, setSelectedRowIndex] = React.useState<number | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);
  const [repollDialogVisible, setRepollDialogVisible] = React.useState(false);
  const [siteId, setSiteId] = React.useState();
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const { token } = useAppSelector((state) => ({
    token: state.authState.token,
  }));

  const fetchData = async () => {
    const response = await getSites(token as string);
    const result = response?.data;
    if (!response?.error) {
      setSites(result);
      setErrorVisible(result[0]?.isWebhookFailed);
      setErrorMsg(result[0]?.errorMsg);
      setIsVisible(false);
    }
  };
  const handleOpen = () => {
    setIsVisible(true);
  };
  const closeDialog = () => {
    setSelectedRow(null);
    setIsEditMode(false);
    setSelectedRowIndex(null);
    setIsVisible(false);
  };
  const deleteHandler = (value: any) => {
    setDeleteDialogVisible(true);
    setSiteId(value.id);
  };
  const repollHandler = (value: any) => {
    setRepollDialogVisible(true);
    setSiteId(value.id);
  };
  const closeDeleteDialog = () => {
    setSelectedRow(null);
    setIsEditMode(false);
    setSelectedRowIndex(null);
    fetchData();
    setDeleteDialogVisible(false);
  };
  const closeRepollDialog = () => {
    setSelectedRow(null);
    setIsEditMode(false);
    setSelectedRowIndex(null);
    fetchData();
    setRepollDialogVisible(false);
  };
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageBase>
      <div className={orderStyles.main}>
        <div className={orderStyles.viewordersContainer}>
          <Box sx={{ width: '100%' }}>
            <div className={orderStyles.heading}>
              <h2>Sites</h2>
              <button className={orderStyles.addButton} onClick={handleOpen}>
                Add Site
              </button>
            </div>

            <div>
              {!isEmpty(sites) ? (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="sites table">
                    <TableHead>
                      <TableRow>
                        <TableCell>SiteId</TableCell>
                        <TableCell>LocationUuid</TableCell>
                        <TableCell>Location Name</TableCell>
                        <TableCell>Created Date</TableCell>
                        <TableCell></TableCell>
                        <TableCell>Repoll</TableCell>
                        <TableCell>Delete</TableCell>
                      </TableRow>
                    </TableHead>
                    <Container
                      axis="y"
                      lockToContainerEdges
                      lockAxis="y"
                      useDragHandle
                      items={sites}
                    >
                      {!sites
                        ? 'Loading'
                        : sites.map((row, index) => (
                            <SortableRow
                              key={row.webflowSiteId}
                              index={index}
                              sx={{
                                '&:last-of-type td, &:last-of type th': {
                                  border: 0,
                                },
                              }}
                            >
                              <TableCell>{row.webflowSiteId}</TableCell>
                              <TableCell>{row.locationUuid}</TableCell>
                              <TableCell>{row.locationName}</TableCell>
                              <TableCell>
                                {moment(row.createdAt).format('YYYY-MM-DD')}
                              </TableCell>
                              {row.isWebhookFailed ? (
                                <>
                                  <TableCell>
                                    <Tooltip
                                      title={row.errorMsg}
                                      placement={'top-start'}
                                      enterDelay={300}
                                    >
                                      <ErrorIcon color="error" />
                                    </Tooltip>
                                  </TableCell>
                                </>
                              ) : (
                                <TableCell>{''}</TableCell>
                              )}
                              <TableCell>
                                <IconButton onClick={() => repollHandler(row)}>
                                  <ReplayOutlined />
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <IconButton onClick={() => deleteHandler(row)}>
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </SortableRow>
                          ))}
                    </Container>
                  </Table>
                </TableContainer>
              ) : (
                'No sites To Show'
              )}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                margin: '24px 16px',
              }}
            >
              <Pagination
                count={totalPages}
                variant="outlined"
                shape="rounded"
                color="primary"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
                onChange={(event: any, page: number) => {
                  setCurrentPage(page);
                  fetchData();
                }}
              />
            </div>
          </Box>
        </div>
      </div>
      <AddSiteDialog
        isVisible={isVisible}
        onClose={closeDialog}
        editMode={undefined}
        initialValues={undefined}
        fetchData={fetchData}
      />
      <DeleteSiteDialog
        isVisible={deleteDialogVisible}
        onClose={closeDeleteDialog}
        siteId={siteId}
      />
      <RepollDialog
        isVisible={repollDialogVisible}
        onClose={closeRepollDialog}
        siteId={siteId}
        fetchData={fetchData}
      />
    </PageBase>
  );
}

export default Dashboard;
