const Joi = require("joi");

const updateSchema = Joi.object({
  camera: Joi.boolean().required(),
  microphone: Joi.boolean().required(),
  audio: Joi.boolean().required(),
  meetingLink: Joi.string().required(),
});

module.exports = {
  updateSchema,
};
