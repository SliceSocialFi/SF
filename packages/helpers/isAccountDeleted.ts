import { NULL_ADDRESS } from "@slice/data/constants";
import type { AccountFragment } from "@slice/indexer";

const isAccountDeleted = (account: AccountFragment): boolean =>
  account.owner === NULL_ADDRESS;

export default isAccountDeleted;
