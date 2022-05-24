import { createTheme } from "@material-ui/core/styles";

import { purple } from "@material-ui/core/colors";
import { amber } from "@material-ui/core/colors";
import { red } from "@material-ui/core/colors";

const theme = createTheme({
  palette: {
    primary: {
      main: "rgb(98, 0, 238)",
    },
    error: {
      main: red["500"],
    },
  },
  typography: { useNextVariants: true },
});

export default theme;
