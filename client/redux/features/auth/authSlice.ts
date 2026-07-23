import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "lms_auth";

const initialState = (() => {
  if (typeof window === "undefined") {
    return { token: "", user: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: "", user: "" };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token ?? "",
      user: parsed?.user ?? "",
    };
  } catch {
    return { token: "", user: "" };
  }
})();

function persistAuthState(state: { token: string; user: any }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: state.token, user: state.user })
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
    userRegistration: (state, action) => {
      state.token = action.payload.token;
      persistAuthState(state as any);
    },
    userLogin: (state, action) => {
      state.user = action.payload.user;
      // Support both payload shapes (some callers used `token`, others used `accessToken`)
      state.token = action.payload.accessToken ?? action.payload.token ?? "";
      persistAuthState(state as any);
    },
    userLoggedOut: (state) => {
      state.user = "";
      state.token = "";
      clearAuthState();
    },
  },
});

export const { userRegistration, userLogin, userLoggedOut } = authSlice.actions;
export default authSlice.reducer;