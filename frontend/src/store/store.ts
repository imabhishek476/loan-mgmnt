import { configureStore } from "@reduxjs/toolkit";
// import your slices/stores here
// import userReducer from "./UserStore";
// import companyReducer from "./CompanyStore";
// import loanReducer from "./LoanStore";

export const store = configureStore({
  reducer: {
    // user: userReducer,
    // company: companyReducer,
    // loan: loanReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
