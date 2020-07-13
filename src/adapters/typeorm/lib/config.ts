import { EntitySchema, ConnectionOptions } from "typeorm";
const parseConnectionString = (
  configString: string | ConnectionOptions
): ConnectionOptions => {
  if (typeof configString !== "string") {
    return configString;
  }

  // If the input is URL string, automatically convert the string to an object
  // to make configuration easier (in most use cases).
  //
  // TypeORM accepts connection string as a 'url' option, but unfortunately
  // not for all databases (e.g. SQLite) or for all options, so we handle
  // parsing it in this function.
  try {
    const parsedUrl = new URL(configString);
    let config: ConnectionOptions;

    if (parsedUrl.protocol.startsWith("mongodb+srv")) {
      // Special case handling is required for mongodb+srv with TypeORM
      config = {
        type: "mongodb",
        url: configString.replace(/\?(.*)$/, ""),
        useNewUrlParser: true,
        useUnifiedTopology: true
      };
    } else {
      config = {
        type: parsedUrl.protocol.replace(/:$/, ""),
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port),
        username: parsedUrl.username,
        password: parsedUrl.password,
        database: parsedUrl.pathname.replace(/^\//, "").replace(/\?(.*)$/, "")
      };
    }

    if (parsedUrl.search) {
      parsedUrl.search
        .replace(/^\?/, "")
        .split("&")
        .forEach(keyValuePair => {
          let [key, value] = keyValuePair.split("=");
          // Converts true/false strings to actual boolean values
          if (value === "true") {
            value = true;
          }
          if (value === "false") {
            value = false;
          }
          config[key] = value;
        });
    }

    return config;
  } catch (error) {
    // If URL parsing fails for any reason, try letting TypeORM handle it
    return {
      url: configString
    };
  }
};

const loadConfig = (config, { models, namingStrategy }) => {
  const defaultConfig = {
    name: "default",
    autoLoadEntities: true,
    entities: [
      new EntitySchema(models.User.schema),
      new EntitySchema(models.Account.schema),
      new EntitySchema(models.Session.schema),
      new EntitySchema(models.VerificationRequest.schema)
    ],
    timezone: "Z", // Required for timestamps to be treated as UTC in MySQL
    logging: false,
    namingStrategy
  };

  return {
    ...defaultConfig,
    ...config
  };
};

export default {
  parseConnectionString,
  loadConfig
};
