import type { ApolloLink } from "@apollo/client";
import { ApolloClient, from } from "@apollo/client";
import cache from "./cache";
import httpLink from "./httpLink";
import retryLink from "./retryLink";

export const createApolloClient = (authLink?: ApolloLink) =>
  new ApolloClient({
    cache,
    devtools: { enabled: true },
    link: authLink
      ? from([authLink, retryLink, httpLink])
      : from([retryLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
      },
      query: {
        fetchPolicy: "cache-first",
      },
    },
  });

const apolloClient = createApolloClient();

export default apolloClient;
