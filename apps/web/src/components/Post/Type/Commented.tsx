import type { PostFragment } from "@slice/indexer";
import ThreadBody from "@/components/Post/ThreadBody";

interface CommentedProps {
  commentOn: PostFragment;
}

const Commented = ({ commentOn }: CommentedProps) => {
  return <ThreadBody post={commentOn} />;
};

export default Commented;
