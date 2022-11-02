const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(2022)
    .required(),
  coverUrl: Joi.string(),
});

module.exports = { AlbumPayloadSchema };
