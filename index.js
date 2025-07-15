const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const chalk = require("chalk");

const User = require("./models/User");
const Application = require("./models/Application");

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

mongoose
  .connect(
    "mongodb+srv://Vladimir:tPinzCtrRagNFvGd@cluster0.5todk8j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log(chalk.green("Connected to MongoDB"));
  })
  .catch((err) => {
    console.error(chalk.red("MongoDB connection error:"), err);
  });

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "superSecret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

function requireLogin(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login");
}

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

async function createAdminUser() {
  const existing = await User.findOne({ email: "admin@example.com" });
  if (!existing) {
    const hashed = await hashPassword("password");
    await new User({
      email: "admin@example.com",
      password: hashed,
      role: "admin",
    }).save();
    console.log(
      chalk.yellow("Admin user created: admin@example.com / password")
    );
  }
}
createAdminUser();

app.get("/", (req, res) => {
  res.render("form", { message: null, errors: null });
});

app.post(
  "/submit-application",
  [
    check("fio", "ФИО обязательно").notEmpty(),
    check("phone", "Телефон обязателен").notEmpty(),
    check("phone", "Неверный формат телефона").matches(/^[+\\d\\s()-]{10,}$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { fio, phone, description } = req.body;

    if (!errors.isEmpty()) {
      return res.render("form", { message: null, errors: errors.array() });
    }

    try {
      await new Application({ fio, phone, description }).save();
      console.log(chalk.green(`Application from ${fio} saved.`));
      res.render("form", {
        message: "Заявка успешно отправлена!",
        errors: null,
      });
    } catch (error) {
      console.error(chalk.red("Ошибка при сохранении заявки:"), error);
      res.render("form", {
        message: "Ошибка при отправке заявки",
        errors: null,
      });
    }
  }
);

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    const isValid = user && (await comparePassword(password, user.password));

    if (isValid) {
      req.session.userId = user._id;
      req.session.userRole = user.role;
      console.log(chalk.blue(`Login success: ${email}`));
      return res.redirect("/applications");
    } else {
      console.log(chalk.red(`Failed login for: ${email}`));
      return res.render("login", { error: "Неверный email или пароль" });
    }
  } catch (err) {
    console.error(chalk.red("Ошибка при входе:"), err);
    res.render("login", { error: "Ошибка при попытке входа" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(chalk.red("Ошибка при выходе:"), err);
    console.log(chalk.blue("User logged out."));
    res.redirect("/login");
  });
});

app.get("/applications", requireLogin, async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.render("applications", {
      applications,
      userRole: req.session.userRole,
      message: null,
    });
  } catch (err) {
    console.error(chalk.red("Ошибка при получении заявок:"), err);
    res.render("applications", {
      applications: [],
      userRole: req.session.userRole,
      message: "Ошибка при получении заявок",
    });
  }
});

app.listen(port, () => {
  console.log(
    chalk.bgGreen.black(`Server running on http://localhost:${port}`)
  );
});
