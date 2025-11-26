import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes as RouterRoutes } from "react-router";
import Layout from "@/components/Common/Layout";
import Custom404 from "@/components/Shared/404";
import PostsShimmer from "@/components/Shared/Shimmer/PostsShimmer";
import AccountPageShimmer from "@/components/Account/Shimmer";

// Lazy load heavy components
const Home = lazy(() => import("@/components/Home"));
const Explore = lazy(() => import("@/components/Explore"));
const ViewAccount = lazy(() => import("@/components/Account"));
const Bookmarks = lazy(() => import("@/components/Bookmarks"));
const ViewGroup = lazy(() => import("@/components/Group"));
const GroupSettings = lazy(() => import("@/components/Group/Settings"));
const GroupMonetizeSettings = lazy(
  () => import("@/components/Group/Settings/Monetize")
);
const GroupPersonalizeSettings = lazy(
  () => import("@/components/Group/Settings/Personalize")
);
const RulesSettings = lazy(() => import("@/components/Group/Settings/Rules"));
const Groups = lazy(() => import("@/components/Groups"));
const NotificationsPage = lazy(
  () => import("@/components/Notification/NotificationsPage")
);
const SocialNotification = lazy(
  () => import("@/components/Notification/Social")
);
const Tasks = lazy(() => import("@/components/Tasks"));
const TaskDetailPage = lazy(() => import("@/components/Tasks/TaskDetailPage"));
const Copyright = lazy(() => import("@/components/Pages/Copyright"));
const Guidelines = lazy(() => import("@/components/Pages/Guidelines"));
const Privacy = lazy(() => import("@/components/Pages/Privacy"));
const Support = lazy(() => import("@/components/Pages/Support"));
const Terms = lazy(() => import("@/components/Pages/Terms"));
const ViewPost = lazy(() => import("@/components/Post"));
const Search = lazy(() => import("@/components/Search"));
const AccountSettings = lazy(() => import("@/components/Settings"));
const BlockedSettings = lazy(() => import("@/components/Settings/Blocked"));
const DeveloperSettings = lazy(() => import("@/components/Settings/Developer"));
const FundsSettings = lazy(() => import("@/components/Settings/Funds"));
const ManagerSettings = lazy(() => import("@/components/Settings/Manager"));
const AccountMonetizeSettings = lazy(
  () => import("@/components/Settings/Monetize")
);
const AccountPersonalizeSettings = lazy(
  () => import("@/components/Settings/Personalize")
);
const SessionsSettings = lazy(() => import("@/components/Settings/Sessions"));
const UsernameSettings = lazy(() => import("@/components/Settings/Username"));
const RewardsSettings = lazy(() => import("./components/Settings/Rewards"));
const Staff = lazy(() => import("./components/Staff"));

const Routes = () => {
  return (
    <BrowserRouter>
      <RouterRoutes>
        <Route element={<Layout />} path="/">
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Home />
              </Suspense>
            }
            index
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Explore />
              </Suspense>
            }
            path="explore"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Search />
              </Suspense>
            }
            path="search"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Groups />
              </Suspense>
            }
            path="groups"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Bookmarks />
              </Suspense>
            }
            path="bookmarks"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <NotificationsPage />
              </Suspense>
            }
            path="notifications"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <SocialNotification />
              </Suspense>
            }
            path="notifications/social"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Tasks />
              </Suspense>
            }
            path="tasks"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <TaskDetailPage />
              </Suspense>
            }
            path="tasks/:taskId"
          />
          <Route
            element={
              <Suspense fallback={<AccountPageShimmer />}>
                <ViewAccount />
              </Suspense>
            }
            path="account/:address"
          />
          <Route
            element={
              <Suspense fallback={<AccountPageShimmer />}>
                <ViewAccount />
              </Suspense>
            }
            path="u/:username"
          />
          <Route path="g/:address">
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <ViewGroup />
                </Suspense>
              }
              index
            />
            <Route path="settings">
              <Route
                element={
                  <Suspense fallback={<PostsShimmer />}>
                    <GroupSettings />
                  </Suspense>
                }
                index
              />
              <Route
                element={
                  <Suspense fallback={<PostsShimmer />}>
                    <GroupPersonalizeSettings />
                  </Suspense>
                }
                path="personalize"
              />
              <Route
                element={
                  <Suspense fallback={<PostsShimmer />}>
                    <GroupMonetizeSettings />
                  </Suspense>
                }
                path="monetize"
              />
              <Route
                element={
                  <Suspense fallback={<PostsShimmer />}>
                    <RulesSettings />
                  </Suspense>
                }
                path="rules"
              />
            </Route>
          </Route>
          <Route path="posts/:slug">
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <ViewPost />
                </Suspense>
              }
              index
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <ViewPost />
                </Suspense>
              }
              path="quotes"
            />
          </Route>
          <Route path="settings">
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <AccountSettings />
                </Suspense>
              }
              index
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <AccountPersonalizeSettings />
                </Suspense>
              }
              path="personalize"
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <AccountMonetizeSettings />
                </Suspense>
              }
              path="monetize"
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <RewardsSettings />
                </Suspense>
              }
              path="rewards"
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <BlockedSettings />
                </Suspense>
              }
              path="blocked"
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <DeveloperSettings />
                </Suspense>
              }
              path="developer"
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <FundsSettings />
                </Suspense>
              }
              path="funds"
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <ManagerSettings />
                </Suspense>
              }
              path="manager"
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <SessionsSettings />
                </Suspense>
              }
              path="sessions"
            />
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <UsernameSettings />
                </Suspense>
              }
              path="username"
            />
          </Route>
          <Route path="staff">
            <Route
              element={
                <Suspense fallback={<PostsShimmer />}>
                  <Staff />
                </Suspense>
              }
              index
            />
          </Route>
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Support />
              </Suspense>
            }
            path="support"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Terms />
              </Suspense>
            }
            path="terms"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Privacy />
              </Suspense>
            }
            path="privacy"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Guidelines />
              </Suspense>
            }
            path="guidelines"
          />
          <Route
            element={
              <Suspense fallback={<PostsShimmer />}>
                <Copyright />
              </Suspense>
            }
            path="copyright"
          />
          <Route element={<Custom404 />} path="*" />
        </Route>
      </RouterRoutes>
    </BrowserRouter>
  );
};

export default Routes;
