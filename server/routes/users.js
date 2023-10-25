const { nanoid } = require("nanoid");
const express = require("express");

const { updateSchema } = require("../schemas");
const { HttpError } = require("../helpers");

const router = express.Router();

const users = [];

router.get("/", (req, res) => {
  try {
    res.json(users);
  } catch (error) {
    res.json(error.message);
  }
});

router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const user = users.find((user) => user.id === id);
    if (!user) {
      throw HttpError(404, "Not found");
    }

    res.status(200).json(user);
  } catch (error) {
    const { status = 500, message = "Server error" } = error;
    res.status(status).json(message);
  }
});

router.post("/", (req, res) => {
  try {
    let { id, meetingLink } = req.body;
    if (!id) {
      throw HttpError(400, "Bad request");
    }
    const user = {
      id,
      camera: false,
      microphone: false,
      audio: false,
      meetingLink,
    };
    users.push(user);

    res.status(201).json(user);
  } catch (error) {
    const { status = 500, message = "Server error" } = error;
    res.status(status).json(message);
  }
});

router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const { error } = updateSchema.validate(data);
    if (error) {
      throw HttpError(404, error.message);
    }

    const index = users.findIndex((user) => user.id === id);
    if (index === -1) {
      throw HttpError(400, "Bad request");
    }
    users[index] = { id, ...data };

    res.status(200).json(users[index]);
  } catch (error) {
    const { status = 500, message = "Server error" } = error;
    res.status(status).json(message);
  }
});

module.exports = router;
