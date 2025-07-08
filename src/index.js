import fetch from 'node-fetch';
import { io } from "socket.io-client";

const LOCAL = 'http://localhost';

const CONNECTION_PREFIX = 'connection';

const CONNECTION = {
  CREATE: `${CONNECTION_PREFIX}_create`,
  REQUEST: `${CONNECTION_PREFIX}_request`,
  RESPONSE: `${CONNECTION_PREFIX}_response`,
};

const SIMPLE_METHODS = ['GET', 'HEAD'];

const store = new WeakMap();

const createPromise = () => {
  const object = {};

  const promise = new Promise((resolve, reject) => {
    Object.assign(object, { resolve, reject });
  });

  Object.assign(promise, object);

  return promise;
};

const createFile = (source) => {
  if (!source) {
    return;
  }

  const {
    buffer,
    mimetype,
    originalFilename,
  } = source;

  if (!buffer) {
    return;
  }

  const options = { type: mimetype };

  const blob = new Blob([buffer], options);
  const file = new File([blob], originalFilename);

  return file;
};

const createBody = (source = {}) => {
  const {
    type,
    body,
    files,
    method,
  } = source;

  const simple = SIMPLE_METHODS.includes(method);

  if (simple) {
    return;
  }

  if (type === 'multipart/form-data') {
    if (!files) {
      return body;
    }

    const b = body || {};
    const a = files || {};

    const data = new FormData();
    const source = { ...a, ...b };
    const entries = Object.entries(source);

    entries.forEach((entry = []) => {
      const [key, value] = entry;
      const result = createFile(value) || value;

      data.append(key, result);
    });

    return data;
  }

  return body;
};

const handleResponse = (response) => {
  const type = response?.headers?.get?.('content-type');

  if (type?.includes('text/')) {
    return response.text();
  }

  if (type?.includes('/json')) {
    return response.json();
  }

  return response;
};

const getter = (socket) => store.get(socket);

const creater = (options = {}) => {
  const {
    port,
    href,
    server,
  } = options;

  if (!server) {
    throw new Error('Passoul: server is required.');
  }

  if (!port && !href) {
    throw new Error('Passoul: port or href is required.');
  }

  const socket = io(server);
  const promise = createPromise();
  const link = href ? href : `${LOCAL}:${port}`;

  socket.on('disconnect', () => {
    store.delete(socket);
  });

  socket.on('connect_error', () => {
    store.delete(socket);
    promise.resolve(socket);
  });

  socket.on(CONNECTION.CREATE, (source = {}) => {
    store.set(socket, source);
    promise.resolve(socket);
  });

  socket.on(CONNECTION.REQUEST, async (source = {}) => {
    const {
      beacon,
      method,
      headers,
      originalUrl,
    } = source;

    try {
      const body = createBody(source);
      const combined = { headers, method };

      body && Object.assign(combined, { body });

      const url = `${link}${originalUrl}`;
      const fetched = await fetch(url, combined);
      const response = await handleResponse(fetched);

      socket.emit(CONNECTION.RESPONSE, { beacon, response })
    } catch (error) {
      console.error(error);
      socket.emit(CONNECTION.RESPONSE, { beacon, error });
    }
  });

  return promise;
};

export { getter };

export default creater;
