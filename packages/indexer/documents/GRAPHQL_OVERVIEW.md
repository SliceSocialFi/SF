# Tài liệu tổng hợp: Queries & Mutations (Indexer's documents)

Tập tin này trình bày cây thư mục chứa các GraphQL documents (queries và mutations) trong `packages/indexer/documents/`. Mỗi entry hiển thị tên file kèm mô tả ngắn ngay sau tên (một dòng). File được chia làm hai phần: "Queries" và "Mutations".

## Queries

- TransactionStatus.graphql (Kiểm tra trạng thái một transaction: finished / pending / failed / not-indexed)

- auth/
  - AuthenticatedSessions.graphql (Lấy danh sách phiên đăng nhập đã xác thực của tài khoản)

- account/
  - Account.graphql (Lấy thông tin chi tiết của một account)
  - AccountManagers.graphql (Lấy danh sách managers của một account)
  - Accounts.graphql (Truy vấn danh sách account theo điều kiện)
  - AccountsAvailable.graphql (Danh sách account khả dụng + tài khoản đăng nhập gần nhất)
  - AccountsBlocked.graphql (Danh sách tài khoản đã bị block và thời điểm)
  - AccountsBulk.graphql (Lấy dữ liệu nhiều account theo lô)
  - AccountStats.graphql (Thống kê liên quan đến account: feed & follow stats)
  - BalancesBulk.graphql (Lấy nhiều số dư; trả về NativeAmount hoặc Erc20Amount)
  - Followers.graphql (Danh sách followers của một account)
  - FollowersYouKnow.graphql (Gợi ý followers bạn có thể biết)
  - Following.graphql (Danh sách accounts mà một account đang follow)
  - FullAccount.graphql (Kết hợp lấy Account chi tiết và AccountStats)
  - Me.graphql (Lấy thông tin `me` và trạng thái pro banner cho post)
  - NotificationIndicator.graphql (Truy vấn nhanh notifications, chỉ lấy id để hiển thị indicator)
  - Notifications.graphql (Lấy các notifications đa dạng: comment, follow, mention, reaction, repost, ...)
  - TokenDistributions.graphql (Lấy phân phối token: amount, timestamp, txHash)
  - Usernames.graphql (Danh sách username / assigned usernames)

- group/
  - Group.graphql (Lấy chi tiết một Group)
  - GroupMembers.graphql (Danh sách thành viên của Group)
  - Groups.graphql (Truy vấn danh sách Group theo điều kiện)
  - GroupStats.graphql (Thống kê cơ bản của Group: totalMembers)

- internal/
  - ProStats.graphql (Truy vấn nội bộ: kết hợp groupStats và balancesBulk — dùng cho tính năng Pro)

- ml/
  - PostsForYou.graphql (ML-driven feed: bài viết gợi ý cho người dùng)
  - PostsExplore.graphql (Bài viết để khám phá / explore)
  - AccountRecommendations.graphql (Gợi ý account cho người dùng)

- post/
  - Post.graphql (Lấy một post theo PostRequest)
  - Posts.graphql (Truy vấn danh sách bài viết chung / feed)
  - Timeline.graphql (Lấy timeline cho người dùng: TimelineItem)
  - TimelineHighlights.graphql (Bài viết nổi bật trong timeline)
  - PostReferences.graphql (Các bài viết tham chiếu đến một post)
  - PostReactions.graphql (Danh sách account đã phản ứng trên post)
  - PostBookmarks.graphql (Các post user đã bookmark)
  - WhoReferencedPost.graphql (Ai đã tham chiếu post này)
  - WhoExecutedActionOnPost.graphql (Ai đã thực thi action trên post)
  - HiddenComments.graphql (Dùng cho moderation; trả về __typename của mục)
  - CollectAction.graphql (Thông tin action collect trên post/repost)

## Mutations

Đây là cây thư mục chứa các mutations trong `packages/indexer/documents/mutations/`. Mỗi file kèm mô tả ngắn ngay sau tên.

- account/
  - AddAccountManager.graphql (Thêm manager vào account)
  - AssignUsernameToAccount.graphql (Gán username cho account)
  - Block.graphql (Chặn một account)
  - CreateAccountWithUsername.graphql (Tạo account mới với username)
  - EnableSignless.graphql (Kích hoạt signless cho account)
  - ExecuteAccountAction.graphql (Thực thi action trên account)
  - Follow.graphql (Theo dõi một account)
  - HideManagedAccount.graphql (Ẩn account được quản lý)
  - Mute.graphql (Tắt tiếng (mute) một account)
  - RemoveAccountManager.graphql (Xóa manager khỏi account)
  - ReportAccount.graphql (Báo cáo một account)
  - RevokeAuthentication.graphql (Thu hồi authentication/session)
  - SetAccountMetadata.graphql (Cập nhật metadata cho account)
  - UnassignUsernameFromAccount.graphql (Hủy gán username khỏi account)
  - Unblock.graphql (Bỏ chặn account)
  - Unfollow.graphql (Bỏ theo dõi account)
  - UnhideManagedAccount.graphql (Bỏ ẩn account quản lý)
  - Unmute.graphql (Bỏ mute account)
  - UpdateAccountFollowRules.graphql (Cập nhật quy tắc follow của account)
  - UpdateAccountManager.graphql (Cập nhật thông tin manager của account)
  - funds/
    - Deposit.graphql (Nạp tiền vào ví / deposit tokens)
    - UnwrapTokens.graphql (Unwrap token)
    - Withdraw.graphql (Rút tiền / withdraw)
    - WrapTokens.graphql (Wrap token)

- auth/
  - Authenticate.graphql (Xác thực/đăng nhập)
  - Challenge.graphql (Yêu cầu challenge cho quá trình đăng nhập)
  - Refresh.graphql (Làm mới token/phiên đăng nhập)
  - SwitchAccount.graphql (Chuyển đổi account đang dùng)

- group/
  - CancelGroupMembershipRequest.graphql (Hủy yêu cầu tham gia group)
  - CreateGroup.graphql (Tạo group mới)
  - JoinGroup.graphql (Yêu cầu/Tham gia group)
  - LeaveGroup.graphql (Rời khỏi group)
  - RequestGroupMembership.graphql (Gửi yêu cầu tham gia group)
  - SetGroupMetadata.graphql (Cập nhật metadata của group)
  - UpdateGroupRules.graphql (Cập nhật quy tắc group)

- ml/
  - MlDismissRecommendedAccounts.graphql (Từ chối/gạt các account gợi ý từ ML)

- post/
  - AddPostNotInterested.graphql (Đánh dấu post là không quan tâm)
  - AddReaction.graphql (Thêm reaction cho post)
  - BookmarkPost.graphql (Đánh dấu bookmark cho post)
  - CreatePost.graphql (Tạo bài viết mới)
  - DeletePost.graphql (Xóa bài viết)
  - EditPost.graphql (Chỉnh sửa bài viết)
  - ExecutePostAction.graphql (Thực thi action trên post)
  - HideReply.graphql (Ẩn reply)
  - ReportPost.graphql (Báo cáo bài viết)
  - Repost.graphql (Repost/Share một bài viết)
  - UndoBookmarkPost.graphql (Hủy bookmark)
  - UndoPostNotInterested.graphql (Bỏ đánh dấu không quan tâm)
  - UndoReaction.graphql (Hủy reaction)
  - UnhideReply.graphql (Bỏ ẩn reply)
