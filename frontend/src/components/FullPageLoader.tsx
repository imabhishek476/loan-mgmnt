import React from "react";
import { CircularProgress, Box } from "@mui/material";

const FullPageLoader: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default FullPageLoader;
