import { Logout, Password, PasswordOutlined } from '@mui/icons-material';
import {
  Avatar,
  Box,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useAppDispatch } from '@/hooks/useReduxHooks';

import { appLogout } from '@/action/auth';

interface Iprop {
  userName: string | undefined;
}

/**
 * Admin Header Menu Component
 *
 * @returns {JSX} JSX
 */
function AdminMenu(props: Iprop) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null);

  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = router.asPath;
      if (currentPath === '/admin/dashboard') {
        setActiveMenuItem('Prospects');
      } else if (currentPath === '/admin/amc') {
        setActiveMenuItem('AMCs');
      } else if (currentPath === '/admin/payments') {
        setActiveMenuItem('Payments');
      } else if (currentPath === '/admin/users') {
        setActiveMenuItem('Users');
      } else {
        setActiveMenuItem(null);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    handleRouteChange();

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const handleOpenUserMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    },
    [],
  );
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = () => {
    dispatch(appLogout());
  };
  const handlePaswordChange = () => {
    router.push('/change-password');
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        Welcome {props.userName}
        <Tooltip title="Admin settings">
          <IconButton
            onClick={handleOpenUserMenu}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'admin-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar sx={{ width: 32, height: 32 }}></Avatar>
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="admin-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        disableScrollLock={true}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 24,
              height: 24,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'black',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
          <Avatar /> Profile
        </MenuItem>
        <MenuItem onClick={handlePaswordChange}>
        <Avatar />  Change password
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
export default memo(AdminMenu);
