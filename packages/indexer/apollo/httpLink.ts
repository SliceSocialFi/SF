import { HttpLink } from "@apollo/client";
import { LENS_API_URL } from "@slice/data/constants";

const httpLink = new HttpLink({
  fetch,
  headers: { 
    "Content-Type": "application/json",
    origin: "https://hey.xyz" 
  },
  uri: LENS_API_URL
});

export default httpLink;
