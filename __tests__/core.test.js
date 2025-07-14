jest.mock('node-fetch');
jest.mock('socket.io-client');

import fetch from 'node-fetch';
import { io } from 'socket.io-client';

import {
  LOCAL,
  DISCONNECT,
  CONNECT_ERROR,
  CONNECTION,
} from '../src/constants.js';
import creater, { getter } from '../src/index.js';

const server = 'http://baidu.com';
const href = 'http://test.com';
const port = 8080;
const originalUrl = '/original-url';
const search = '?a=b';

const ioMock = (socket) => {
  io.mockReturnValue(socket);

  return socket;
};

const createrMock = (socket = {}) => (options) => {
  const {
    on,
    emit,
    created = {},
  } = socket;

  socket.emit = emit || (() => {});

  socket.on = (...args) => {
    const [event, callback] = args;

    if (event === CONNECTION.CREATE) {
      callback(created);
    }

    socket[event] = callback;
    on?.(...args);
  };

  ioMock(socket);
  return creater(options);
};

beforeEach(() => {
  io.mockReset();
  fetch.mockReset();
});

test('Passoul require server', () => {
  const callback = () => creater();

  expect(callback).toThrow(/server/);
});

test('Passoul require href of port', () => {
  const socket = ioMock({
    on: () => {},
  });

  const callback = () => creater({ server });
  const callbackWithHref = () => creater({ server, href });
  const callbackWithPort = () => creater({ server, port });

  expect(callback).toThrow(/required/);
  expect(callbackWithHref).not.toThrow();
  expect(callbackWithPort).not.toThrow();
});

test('Add events after creater', async () => {
  const options = { server, port };

  const socket = await createrMock()(options);
  const events = Object.keys(socket);

  expect(io.mock.calls).toHaveLength(1);
  expect(io.mock.calls[0][0]).toBe(server);

  expect(events).toContain(DISCONNECT);
  expect(events).toContain(CONNECT_ERROR);
  expect(events).toContain(CONNECTION.REQUEST);
  expect(events).toContain(CONNECTION.CREATE);
});

test('Resolve after create', async () => {
  const created = {};
  const socket = { created };
  const options = { server, port };

  const result = await createrMock(socket)(options);

  expect(socket).toBe(result);
  expect(getter(socket)).toBe(created);
});

test('Passoul support request with port', async () => {
  const options = { server, port };
  
  const socket = await createrMock()(options);

  await socket[CONNECTION.REQUEST]({});

  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][0]).toBe(`${LOCAL}:${port}`);
});

test('Passoul support request with href', async () => {
  const options = { server, href };
  
  const socket = await createrMock()(options);

  await socket[CONNECTION.REQUEST]({});

  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][0]).toBe(href);
});

test('Passoul pass request with originalUrl and search', async () => {
  const options = { server, href };
  const object = { originalUrl, search };
  
  const socket = await createrMock()(options);
  const link = `${href}${originalUrl}${search}`

  await socket[CONNECTION.REQUEST](object);

  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][0]).toBe(link);
});

test('Passoul pass get request', async () => {
  const options = { server, href };

  const body = {};
  const extra = { method: 'GET' };
  const basic = { search, originalUrl };
  const object = { ...basic, ...extra, body };
  
  const socket = await createrMock()(options);
  const link = `${href}${originalUrl}${search}`

  await socket[CONNECTION.REQUEST](object);

  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][0]).toBe(link);
  expect(fetch.mock.calls[0][1]).toEqual(extra);
});

test('Passoul pass post request', async () => {
  const options = { server, href };

  const body = { name: 'xiaoshuang' };
  const extra = { method: 'POST', body };
  const basic = { search, originalUrl };
  const object = { ...basic, ...extra };
  
  const socket = await createrMock()(options);
  const link = `${href}${originalUrl}${search}`

  await socket[CONNECTION.REQUEST](object);

  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][0]).toBe(link);
  expect(fetch.mock.calls[0][1]).toEqual(extra);
});

test('Passoul pass post form request with body', async () => {
  const options = { server, href };

  const type = 'multipart/form-data';
  const body = { name: 'xiaoshuang' };
  const extra = { method: 'POST', body };
  const basic = { search, originalUrl, type };
  const object = { ...basic, ...extra };
  
  const socket = await createrMock()(options);
  const link = `${href}${originalUrl}${search}`

  await socket[CONNECTION.REQUEST](object);

  const args = fetch.mock.calls[0] || [];

  expect(fetch.mock.calls).toHaveLength(1);

  expect(args[0]).toBe(link);
  expect(args[1].body).toBeInstanceOf(FormData);
  expect(args[1].body.get('name')).toBe(body.name);
});

test('Passoul pass post form request with files', async () => {
  const options = { server, href };

  const content = 'const a = 2;';
  const originalFilename = 'test.js';
  const mimetype = 'application/javascript';
  const blob = new Blob([content], { type: mimetype });
  const buffer = await blob.arrayBuffer();

  const files = {
    [originalFilename]: {
      buffer,
      mimetype,
      originalFilename,
    },
  };

  const type = 'multipart/form-data';
  const extra = { method: 'POST', files };
  const basic = { search, originalUrl, type };
  const object = { ...basic, ...extra };
  
  const socket = await createrMock()(options);
  const link = `${href}${originalUrl}${search}`

  await socket[CONNECTION.REQUEST](object);

  const args = fetch.mock.calls[0] || [];
  const file = args[1].body.get(originalFilename);
  const fileContent = await file.text();

  expect(fetch.mock.calls).toHaveLength(1);

  expect(args[0]).toBe(link);
  expect(args[1].body).toBeInstanceOf(FormData);

  expect(file).toBeInstanceOf(File);
  expect(file.name).toBe(originalFilename);
  expect(fileContent).toBe(content);
});

test('Passoul pass post form request with files and body', async () => {
  const options = { server, href };

  const content = 'const a = 2;';
  const originalFilename = 'test.js';
  const mimetype = 'application/javascript';
  const blob = new Blob([content], { type: mimetype });
  const buffer = await blob.arrayBuffer();

  const files = {
    [originalFilename]: {
      buffer,
      mimetype,
      originalFilename,
    },
  };

  const body = { name: 'xiaoshuang' };
  const type = 'multipart/form-data';
  const extra = { method: 'POST', files, body };
  const basic = { search, originalUrl, type };
  const object = { ...basic, ...extra };
  
  const socket = await createrMock()(options);
  const link = `${href}${originalUrl}${search}`

  await socket[CONNECTION.REQUEST](object);

  const args = fetch.mock.calls[0] || [];
  const file = args[1].body.get(originalFilename);
  const fileContent = await file.text();

  expect(fetch.mock.calls).toHaveLength(1);

  expect(args[0]).toBe(link);
  expect(args[1].body).toBeInstanceOf(FormData);
  expect(args[1].body.get('name')).toBe(body.name);

  expect(file).toBeInstanceOf(File);
  expect(file.name).toBe(originalFilename);
  expect(fileContent).toBe(content);
});

test('Passoul pass get json response', async () => {
  const beacon = '@@BEACON';
  const options = { server, href };
  const object = { beacon, originalUrl };
  const link = `${href}${originalUrl}`;
  
  const emit = jest.fn();
  const socket = await createrMock({ emit })(options);

  const response = { name: 'xiaoshaung' };
  const headers = { 'content-type': 'application/json' };

  const json = JSON.stringify(response);
  const headersInstance = new Headers(headers);
  const responseOptions = { headers: headersInstance };
  const mockReturn = new Response(json, responseOptions);

  fetch.mockReturnValue(mockReturn);
  await socket[CONNECTION.REQUEST](object);

  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][0]).toBe(link);

  expect(emit.mock.calls).toHaveLength(1);
  expect(emit.mock.calls[0][0]).toBe(CONNECTION.RESPONSE);
  expect(emit.mock.calls[0][1]).toEqual({ beacon, headers, response });
});

test('Passoul pass get text response', async () => {
  const beacon = '@@BEACON';
  const options = { server, href };
  const object = { beacon, originalUrl };
  const link = `${href}${originalUrl}`;
  
  const emit = jest.fn();
  const socket = await createrMock({ emit })(options);

  const response = '<html>1111</html>';
  const headers = { 'content-type': 'text/html' };

  const headersInstance = new Headers(headers);
  const responseOptions = { headers: headersInstance };
  const mockReturn = new Response(response, responseOptions);

  fetch.mockReturnValue(mockReturn);
  await socket[CONNECTION.REQUEST](object);

  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][0]).toBe(link);

  expect(emit.mock.calls).toHaveLength(1);
  expect(emit.mock.calls[0][0]).toBe(CONNECTION.RESPONSE);
  expect(emit.mock.calls[0][1]).toEqual({ beacon, headers, response });
});

test('Passoul pass get buffer response', async () => {
  const beacon = '@@BEACON';
  const options = { server, href };
  const object = { beacon, originalUrl };
  const link = `${href}${originalUrl}`;
  
  const emit = jest.fn();
  const socket = await createrMock({ emit })(options);

  const blob = new Blob(['lixiaoshuang']);
  const response = await blob.arrayBuffer();
  const headers = { 'content-type': 'image/png' };

  const headersInstance = new Headers(headers);
  const responseOptions = { headers: headersInstance };
  const mockReturn = new Response(response, responseOptions);

  fetch.mockReturnValue(mockReturn);
  await socket[CONNECTION.REQUEST](object);

  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][0]).toBe(link);

  expect(emit.mock.calls).toHaveLength(1);
  expect(emit.mock.calls[0][0]).toBe(CONNECTION.RESPONSE);
  expect(emit.mock.calls[0][1]).toEqual({ beacon, headers, response });
});
