import fetch from 'node-fetch';
import { io } from "socket.io-client";

const LOCAL = 'http://localhost';

const CONNECTION_PREFIX = 'connection';

const CONNECTION = {
  CREATE: `${CONNECTION_PREFIX}_create`,
  REQUEST: `${CONNECTION_PREFIX}_request`,
  RESPONSE: `${CONNECTION_PREFIX}_response`,
};

const store = new WeakMap();

const createPromise = () => {
  const object = {};

  const promise = new Promise((resolve, reject) => {
    Object.assign(object, { resolve, reject });
  });

  Object.assign(promise, object);

  return promise;
};

const createrFile = (source) => {
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

const createrBody = (source = {}) => {
  const { type, body, files } = source;

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
      const result = createrFile(value) || value;

      data.append(key, result);
    });

    return data;
  }

  return body;
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

  const socket = io(url);
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
  });

  socket.on(CONNECTION.REQUEST, async (source = {}) => {
    const {
      beacon,
      method,
      headers,
    } = source;

    try {
      const body = createrBody(source);
      const combined = { headers, method, body };
      const response = await fecth(link, combined);

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
