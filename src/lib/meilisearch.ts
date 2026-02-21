import { MeiliSearch } from "meilisearch";

if (!process.env.MEILISEARCH_HOST) {
  throw new Error("MEILISEARCH_HOST is not set");
}

export const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
});
