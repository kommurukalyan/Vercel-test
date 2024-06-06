import { createSlice } from '@reduxjs/toolkit';

import { IUserDTO } from '@/types/interfaces/userdto';

type userType = IUserDTO;

interface AuthState {
  user: userType | undefined;
  token: string | undefined;
}

/**
 * Default state object with initial values.
 */
const initialState: AuthState = {
  user: undefined,
  token: undefined,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUserSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: () => initialState,

    getUserData: (state, action) => {
      state.user = action.payload;
    },
  },
});

const authReducer = authSlice.reducer;
export const { loginUserSuccess, logout, getUserData } = authSlice.actions;

export default authReducer;
