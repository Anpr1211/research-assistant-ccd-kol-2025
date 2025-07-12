import { onCallGenkit } from "firebase-functions/https";
import { researchFlow } from "./researchAssistant";
import { defineSecret } from "firebase-functions/params";

export const apiKey = defineSecret("GEMINI_API_KEY");
export const cloudSqlConnectionName = defineSecret("CLOUD_SQL_CONNECTION_NAME");
export const dbPort = defineSecret("DB_PORT");
export const dbName = defineSecret("DB_NAME");
export const dbUser = defineSecret("DB_USER");
export const dbHost = defineSecret("DB_HOST");
export const dbPassword = defineSecret("DB_PASSWORD");

export const researchAssistant = onCallGenkit(
  {
    secrets: [
      apiKey,
      cloudSqlConnectionName,
      dbPort,
      dbName,
      dbUser,
      dbPassword,
      dbHost,
    ],
    cors: true,
    authPolicy: () => {
      return true;
    },
    enforceAppCheck: false,
  },
  researchFlow
);
