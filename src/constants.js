export const LOCAL = 'http://localhost';

export const SIMPLE_METHODS = ['GET', 'HEAD'];

export const DISCONNECT = 'disconnect';

export const CONNECT_ERROR = 'connect_error';

export const CONNECTION_PREFIX = 'connection';

export const CONNECTION = {
  CREATE: `${CONNECTION_PREFIX}_create`,
  REQUEST: `${CONNECTION_PREFIX}_request`,
  RESPONSE: `${CONNECTION_PREFIX}_response`,
};