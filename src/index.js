const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);

  if (!user)
    return response.status(404).json({
      error: "User not found",
    });

  request.user = user;
  next();
}

function checkIfExistsSpecifiedTask(request, response, next) {
  const { id } = request.params;
  const todoIndex = request.user.todos.findIndex((todo) => todo.id === id);

  if (todoIndex === -1)
    return response.status(404).json({
      error: "Todo not found",
    });

  request.todoIndex = todoIndex;
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.find((user) => user.username === username);

  if (userAlreadyExists)
    return response.status(400).json({ error: "User already exists" });

  const newUser = { id: uuidv4(), name, username, todos: [] };
  users.push(newUser);
  response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;
  response.status(200).json(todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { todos } = request.user;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  todos.push(newTodo);
  response.status(201).json(newTodo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checkIfExistsSpecifiedTask,
  (request, response) => {
    const { title, deadline } = request.body;
    const todoIndex = request.todoIndex;
    const { todos } = request.user;

    todos[todoIndex] = {
      ...todos[todoIndex],
      title,
      deadline: new Date(deadline),
    };

    response.status(200).json(todos[todoIndex]);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checkIfExistsSpecifiedTask,
  (request, response) => {
    const todoIndex = request.todoIndex;
    const { todos } = request.user;

    todos[todoIndex] = {
      ...todos[todoIndex],
      done: true,
    };

    response.status(200).json(todos[todoIndex]);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checkIfExistsSpecifiedTask,
  (request, response) => {
    const todoIndex = request.todoIndex;
    const { todos } = request.user;

    todos.splice(todoIndex, 1);
    response.status(204).end();
  }
);

module.exports = app;
