#!/usr/bin/env node

import fs from 'fs';
import url from 'url';
import path from 'path';
import { program } from 'commander';

import creater, { getter } from '../src/index.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_PATH = path.resolve(__dirname, '../');

const runForVersion = (options) => {
  const file = path.resolve(ROOT_PATH, './package.json');
  const json = fs.readFileSync(file, 'utf8');
  const { version } = JSON.parse(json);

  options?.version && console.log(version);
}

const run = async (options = {}) => {
  const { version } = options;

  if (version) {
    runForVersion(options);
    return;
  }

  const socket = await creater(options);
  const got = getter(socket) || {};
  const { hostname } = got;

  console.log(`http://${hostname}`);
};

program
  .name('passoul')
  .allowUnknownOption()
  .option('-s, --server <string>', 'Web service run by Passerver')
  .option('-h, --href <string>', 'Local href for you service')
  .option('-p, --port <number>', 'Local port for you service')
  .option('-v, --version', 'display version for Passoul')
  .action(run)
  .parse(process.argv);
