jest.mock('node-fetch');
jest.mock('socket.io-client');
jest.mock('../src/index.js');

import path from 'path';
import { execSync } from 'child_process';

import fetch from 'node-fetch';
import { io } from 'socket.io-client';

import creater, { getter } from '../src/index.js';

const ROOT_PATH = path.resolve(__dirname, '../');
const filePath = path.resolve(ROOT_PATH, 'bin/index.js');

const server = 'http://baidu.com';
const href = 'http://test.com';
const port = 8080;

beforeEach(() => {
  getter.mockReset();
  creater.mockReset();
});

test('Passoul require server', () => {
  const command = `node ${filePath}`;
  const callback = () => execSync(command);

  expect(callback).toThrow(/server/);
});

test('Passoul require href of port', () => {
  io.mockReturnValue({
    on: () => {},
    emit: () => {},
  });

  const command = `node ${filePath}`;

  const callback = () => execSync(`node ${filePath} --server ${server}`);
  const callbackWithHref = () => execSync(`node ${filePath} --server ${server} --href ${href}`);
  const callbackWithPort = () => execSync(`node ${filePath} --server ${server} --port ${port}`);

  expect(callback).toThrow(/required/);
  expect(callbackWithHref).toThrow(/[^(required)]/);
  expect(callbackWithPort).toThrow(/[^(required)]/);
});

test('Passoul require href of port with aliases', () => {
  io.mockReturnValue({
    on: () => {},
    emit: () => {},
  });

  const command = `node ${filePath}`;

  const callback = () => execSync(`node ${filePath} -s ${server}`);
  const callbackWithHref = () => execSync(`node ${filePath} -s ${server} -h ${href}`);
  const callbackWithPort = () => execSync(`node ${filePath} -s ${server} -p ${port}`);

  expect(callback).toThrow(/required/);
  expect(callbackWithHref).toThrow(/[^(required)]/);
  expect(callbackWithPort).toThrow(/[^(required)]/);
});
