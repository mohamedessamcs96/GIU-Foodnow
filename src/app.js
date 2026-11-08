import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import restaurantsRouter from "./routes/restaurants.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import docsRouter from "./routes/docs.routes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/doc", docsRouter);

app.use("/api/v1/restaurants", restaurantsRouter);
app.use("/api/v1/orders", ordersRouter);

app.use(notFound);
app.use(errorHandler); // always last

export default app;
