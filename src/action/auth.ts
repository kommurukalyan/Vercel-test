import Router from 'next/router';

import { store } from '@/store';
import { loginUserSuccess, logout } from '@/store/slices/authSlice';

import fetchApi from '@/client-service/api';
import LoginRquest from '@/server/request/loginRquest';
import logger from '@/server/serverUtils/logger';
import { emitErrorNotification, emitNotification } from '@/lib/helper';
import { removeToken, setToken } from '@/utils/verifyAuthentication';
import PasswordChangeRequest from '@/server/request/passwordChangeRequest';

export default function postAuthSuccess(
  token: string,
  user: any,
  storeInCookie = true,
) {
  try {
    // Safari is not setting the token on the response cookies so, Handling this via small hack
    // TODO: Need to find a fix for this
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setToken(token, storeInCookie);

    store.dispatch(
      loginUserSuccess({
        token: token,
        user: user,
        isAMCLoggedIn: token ? user.isAmcUser : false,
      }),
    );
  } catch (error) {
    logger.log(error, 'error');
  }
}

export async function handleLogin(payload: LoginRquest) {
  try {
    const result = await fetchApi('/api/auth/login', payload, 'post');
    const response = await result.json();
    if (!response.error) {
      const { token, user } = response.data;
      postAuthSuccess(token, user);
      return { response: response, msg: 'success' };
    } else {
      emitErrorNotification(response.msg);
      return { msg: 'error' };
    }
  } catch (error) {
    return {
      forceChangePassword: false,
      isInspectAdmin: false,
      isLoginSuccess: false,
    };
  }
}

export function appLogout() {
  return async (dispatch: any) => {
    try {
      const result = await fetchApi('/api/auth/logout', {}, 'post');
      await result.json();
      Router.push('/').then(() => {
        removeToken();
        dispatch(logout());
      });
    } catch (error) {
      Router.push('/').then(() => {
        removeToken();
        dispatch(logout());
      });
    }
  };
}

export async function updatePassword(
  payload: PasswordChangeRequest,
  token: string,
) {
  try {
    const result = await fetchApi(
      '/api/auth/change-password',
      payload,
      'post',
      {
        Authorization: `Bearer ${token}`,
      },
    );
    const response = await result.json();
    if (!response.error) {
      emitNotification('success', response.msg);
      return true;
    } else {
      emitErrorNotification(response.msg);
      return false;
    }
  } catch (error) {
    return false;
  }
}
