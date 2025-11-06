import type { PostActionConfigInput } from "@slice/indexer";
import type { CollectActionType } from "@slice/types/hey";

const collectActionParams = (
  collectAction: CollectActionType
): PostActionConfigInput | null => {
  const { payToCollect, collectLimit, endsAt } = collectAction;

  return {
    simpleCollect: { collectLimit, endsAt, payToCollect }
  };
};

export default collectActionParams;
