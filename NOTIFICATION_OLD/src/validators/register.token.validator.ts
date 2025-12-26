import Joi from 'joi';

export const registerTokenSchema = Joi.object({
  token: Joi.string().required(),
});
