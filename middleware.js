'use strict';

const Joi = require('@hapi/joi');
const { writeFile } = require('fs');
const data = require('./data/pokemon');

const modifySchema = {
  name: Joi.string().required(),
};

const createSchema = {
  ...modifySchema,
  attacks: Joi.object().required(),
};

function sendAllPokemon(_, res) {
  res.json(data);
}

function sendPokemon(req, res, next) {
  if (res.err) {
    next();
  } else {
    res.json(req.pokemon);
  }
}

function sendAttacks(req, res, next) {
  if (res.err) {
    next();
  } else {
    res.json(req.pokemon.attacks);
  }
}

function validateBody(req, res, next) {
  const schema = req.params.id ? modifySchema : createSchema;
  const { error, value } = Joi.validate(req.body, schema);
  if (error) {
    res.status(400);
    res.err = error.details[0].message.replace(/\"/g, '\'');
  } else {
    const id = req.params.id || makeID();
    req.pokemon = { id, ...value };
  }
  next();
}

function makeID() {
  const id = String(data.length + 1);
  return '0'.repeat(Math.max(0, 3 - id.length)) + id;
}

function findByID(req, res, next, id) {
  const idx = data.findIndex(e => e.id === id);
  if (idx === -1) {
    res.status(404);
    res.err = `No pokemon with ID '${id}' was found`;
  } else {
    req.pokemonIdx = idx;
    req.pokemon = data[idx];
  }
  next();
}

function create(req, res, next) {
  if (!res.err) {
    const name = req.body.name;
    const pokemon = data.find(e => e.name === name);
    if (pokemon) {
      res.status(409);
      res.err = `A pokemon with name '${name}' already exists`;
    } else {
      res.status(201);
      data.push(req.pokemon);
    }
  }
  next();
}

function modify(req, res, next) {
  if (!res.err) {
    data[req.pokemonIdx] = req.pokemon;
  }
  next();
}

function remove(req, res, next) {
  if(!res.err) {
    data.splice(req.pokemonIdx, 1);
  }
  next();
}

/**
 * In a real application this would deal with an actual database
 */
function write(_, res, next) {
  if (res.err) {
    next();
  } else {
    const str = `module.exports = ${JSON.stringify(data, null, 2)}`;
    writeFile('./data/pokemon.js', str, (err) => {
      if (err) {
        res.status(500);
        res.err = 'Unexpected error while writing to disk';
      }
      next();
    });
  }
}

function unsupportedMethod(_, res, next) {
  if (!res.err) {
    res.status(405);
    res.err = 'Unsupported method for the specified resource';
  }
  next();
}

function resourceNotFound(_, res, next) {
  if (!res.err) {
    res.status(404);
    res.err = 'The specified resource could not be found';
  }
  next();
}

function sendError(_, res) {
  res.json({ err: res.err });
}

module.exports = {
  findByID,
  sendAttacks,
  sendPokemon,
  sendAllPokemon,
  unsupportedMethod,
  errorStack: [resourceNotFound, sendError],
  deleteStack: [remove, write, sendPokemon],
  putStack: [validateBody, modify, write, sendPokemon],
  postStack: [validateBody, create, write, sendPokemon],
}
