import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useMobileDrawerModalStore } from "@/store/non-persisted/modal/useMobileDrawerModalStore";
import { useNavigate } from "react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDebounce, useClickAway } from "@uidotdev/usehooks";
import type { MutableRefObject } from "react";
import getAccount from "@slice/helpers/getAccount";
import {
  type AccountFragment,
  type AccountsRequest,
  AccountsOrderBy,
  PageSize,
  useAccountsLazyQuery
} from "@slice/indexer";
import SingleAccount from "@/components/Shared/Account/SingleAccount";
import Loader from "@/components/Shared/Loader";
import { Card } from "@/components/Shared/UI";
import { useAccountLinkStore } from "@/store/non-persisted/navigation/useAccountLinkStore";
import { useSearchStore } from "@/store/persisted/useSearchStore";
import RecentAccounts from "@/components/Shared/Search/RecentAccounts";
import { createPortal } from "react-dom";

interface MobileHeaderProps {
  searchPlaceholder?: string;
  showSearch?: boolean;
}

const MobileHeader = ({
  searchPlaceholder = "Search...",
  showSearch = true
}: MobileHeaderProps) => {
  const { currentAccount } = useAccountStore();
  const { setShow: setShowMobileDrawer } = useMobileDrawerModalStore();
  const navigate = useNavigate();
  const { setCachedAccount } = useAccountLinkStore();
  const { addAccount } = useSearchStore();
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [accounts, setAccounts] = useState<AccountFragment[]>([]);
  const [lastQuery, setLastQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearchText = useDebounce<string>(searchValue, 500);

  const handleReset = useCallback(() => {
    setShowDropdown(false);
    setAccounts([]);
    setSearchValue("");
    setLastQuery("");
  }, []);

  // Clear accounts when dropdown opens and calculate position
  useEffect(() => {
    if (showDropdown) {
      setAccounts([]);
      
      // Calculate dropdown position
      if (searchWrapRef.current) {
        const rect = searchWrapRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        });
      }
    }
  }, [showDropdown]);

  // Handle click outside
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        searchWrapRef.current &&
        !searchWrapRef.current.contains(target)
      ) {
        handleReset();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown, handleReset]);

  const [searchAccounts, { loading }] = useAccountsLazyQuery({
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}&type=accounts`);
      handleReset();
    }
  };

  const handleAccountClick = useCallback(
    (account: AccountFragment) => {
      setCachedAccount(account);
      addAccount(account.address);
      navigate(getAccount(account).link);
      handleReset();
    },
    [addAccount, handleReset, navigate, setCachedAccount]
  );

  useEffect(() => {
    if (showDropdown && debouncedSearchText) {
      // Only fetch if query actually changed
      if (debouncedSearchText !== lastQuery) {
        setAccounts([]); // Clear before fetch
        setLastQuery(debouncedSearchText);
        
        const request: AccountsRequest = {
          filter: { searchBy: { localNameQuery: debouncedSearchText } },
          orderBy: AccountsOrderBy.BestMatch,
          pageSize: PageSize.Fifty
        };

        searchAccounts({ variables: { request } }).then((res) => {
          if (res.data?.accounts?.items) {
            setAccounts(res.data.accounts.items);
          }
        });
      }
    } else if (!debouncedSearchText) {
      // Clear accounts when search text is empty
      setAccounts([]);
      setLastQuery("");
    }
  }, [debouncedSearchText, lastQuery, searchAccounts, showDropdown]);

  if (!showSearch) return null;

  return (
    <div className="relative flex items-center gap-3 px-3 md:hidden pb-3 pt-3 w-full max-w-full overflow-hidden" ref={dropdownRef}>
        {/* Avatar */}
        <button
        onClick={() => setShowMobileDrawer(true)}
        type="button"
        className="flex-shrink-0"
        aria-label="Open menu"
      >
        <img
          src={(currentAccount as any)?.metadata?.picture || "/default-avatar.png"}
          alt={currentAccount?.address || "User"}
          className="size-10 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover"
        />
      </button>

      {/* Search Bar */}
      <div className="flex-1 relative" ref={searchWrapRef}>
        <form onSubmit={handleSearch} className="relative search-wrap">
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
          <input
            className="relative z-10 w-full bg-transparent py-2.5 pr-10 pl-10 text-base placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white border-none outline-none focus:ring-0"
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              // Delay để cho phép click vào dropdown trước khi ẩn
              setTimeout(() => setShowDropdown(false), 200);
            }}
            placeholder={searchPlaceholder}
            type="text"
            value={searchValue}
          />
          {searchValue && (
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={handleReset}
            >
              <XMarkIcon className="size-4" />
            </button>
          )}
        </form>
      </div>

      {/* Dropdown Results - Portal */}
      {showDropdown && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[100]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          <Card 
            forceRounded 
            className="max-h-[60vh] overflow-y-auto py-2 bg-white dark:bg-black"
          >
          {!debouncedSearchText && (
            <RecentAccounts onAccountClick={handleReset} />
          )}
          {loading ? (
            <Loader className="my-3" message="Searching users" small />
          ) : (
            <>
              {accounts.map((account) => (
                <div 
                  key={account.address} 
                  onClick={() => handleAccountClick(account)}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <SingleAccount 
                    account={account}
                    hideFollowButton
                    hideUnfollowButton
                    linkToAccount={false}
                    showUserPreview={false}
                  />
                </div>
              ))}
              {accounts.length ? null : (
                <div className="px-4 py-2">
                  Try searching for people or keywords
                </div>
              )}
            </>
          )}
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MobileHeader;
