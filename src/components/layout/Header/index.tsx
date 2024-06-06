import { Toolbar } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { useAppSelector } from '@/hooks/useReduxHooks';

import AdminMenu from '@/components/layout/Header/AdminMenu';

export const headerStyles = {
  userBtn: {
    fontSize: '16px',
    color: '#FFFFFF',
    '& .MuiButton-endIcon': {
      marginLeft: '0',
    },
  },
};

function Header() {
  const { token, user } = useAppSelector((state) => ({
    user: state.authState.user,
    token: state.authState.token,
  }));

  return (
    <div className="header">
      <Toolbar
        className="row between toolHeader"
        style={{ justifyContent: 'space-between' }}
      >
        <Link href="/dashboard">
          <Image
            alt="Menu-Bridge"
            priority
            src="/images/logo.png"
            width={160}
            height={58}
            style={{ animationDuration: '.5s' }}
          />
        </Link>
        {token ? <AdminMenu userName={user?.name as string} /> : ''}
      </Toolbar>
    </div>
  );
}
export default Header;
