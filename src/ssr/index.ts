import { hasAuthenticationCookie } from '@/utils/verifyAuthentication';

const getServerSidePropsPrivate = (context: any) => {
  const isAuthenticated = hasAuthenticationCookie(context);

  if (!isAuthenticated) {
    return {
      redirect: {
        destination: '/login?auth_required=true',
      },
    };
  }
  return { props: {} };
};

const getServerSidePropsPublic = (context: any) => {
  const isAuthenticated = hasAuthenticationCookie(context);
  if (isAuthenticated) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  return { props: {} };
};

export { getServerSidePropsPrivate, getServerSidePropsPublic };
