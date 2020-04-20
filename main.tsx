import * as React from "react";
import {render} from "react-dom";

import {App} from "./components/app";

render(<App />, document.body.appendChild(document.createElement("div")));
