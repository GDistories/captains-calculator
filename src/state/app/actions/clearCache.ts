import { Action } from "state/_types";

export const clearCache: Action = async () => {
    // localStorage.removeItem('app-nodes');
    // localStorage.removeItem('app-settings');
    localStorage.clear();
};
