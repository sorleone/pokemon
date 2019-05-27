'use strict';

const express = require('express');
const mw = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.route('/pokemon')
   .get(mw.sendAllPokemon)
   .post(mw.postStack)
   .all(mw.unsupportedMethod);

app.param('id', mw.findByID);
app.route('/pokemon/:id')
   .get(mw.sendPokemon)
   .put(mw.putStack)
   .delete(mw.deleteStack)
   .all(mw.unsupportedMethod);

app.get('/pokemon/:id/attacks', mw.sendAttacks)
   .all(mw.unsupportedMethod);

app.use('*', mw.errorStack);

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
