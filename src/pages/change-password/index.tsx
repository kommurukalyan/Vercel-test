import React from 'react';

import PageBase from '@/components/layout/PageBase';


import { getServerSidePropsPrivate } from '@/ssr';
import ChangePasswordForm from '@/components/pages/change-password';

function ChangePassword() {
  return (
    <PageBase>
      <ChangePasswordForm />
    </PageBase>
  );
}

export const getServerSideProps = getServerSidePropsPrivate;

export default ChangePassword;