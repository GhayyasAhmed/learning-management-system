import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "lms_auth";

export interface IUser {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: { url: string };
  role?: string;
  [key: string]: unknown;
}

export interface AuthState {
  token: string;
  user: IUser | string;
  isSocial?: boolean;
}

const initialState: AuthState = (() => {
  if (typeof window === "undefined") {
    return { token: "", user: "", isSocial: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: "", user: "", isSocial: false };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token ?? "",
      user: parsed?.user ?? "",
      isSocial: parsed?.isSocial ?? false,
    };
  } catch {
    return { token: "", user: "", isSocial: false };
  }
})();

function persistAuthState(state: { token: string; user: IUser | string; isSocial?: boolean }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: state.token,
        user: state.user,
        isSocial: state.isSocial ?? false,
      })
    );
  } catch {
    // ignore
  }
}

function clearAuthState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userRegistration: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
      state.isSocial = false;
      persistAuthState(state);
    },
    userLogin: (
      state,
      action: PayloadAction<{
        user: IUser;
        token?: string;
        accessToken?: string;
        isSocial?: boolean;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken ?? action.payload.token ?? "";
      state.isSocial = action.payload.isSocial ?? false;
      persistAuthState(state);
    },
    userLoggedOut: (state) => {
      state.user = "";
      state.token = "";
      state.isSocial = false;
      clearAuthState();
    },
  },
});

export const { userRegistration, userLogin, userLoggedOut } = authSlice.actions;
export default authSlice.reducer;