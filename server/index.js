const express = require("express");
const router = require("./routes");
const app = express();
const cors = require("cors");

const corsOptions = {
  origin: ["http://localhost:3000", "http://192.168.0.110:3000"],
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(router);

(() => {
  app.listen(5050, () => console.log("Server started on port 5050..."));
})();
