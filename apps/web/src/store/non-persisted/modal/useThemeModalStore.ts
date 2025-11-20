import { createToggleStore } from "@/store/createToggleStore";

const { useStore: useThemeModalStore } = createToggleStore();

export { useThemeModalStore };
