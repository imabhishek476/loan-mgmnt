import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/UserStore";
import Body from "./Body";
import "./index.css";
import "../src/App.css";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <Body />
  </Provider>
);
