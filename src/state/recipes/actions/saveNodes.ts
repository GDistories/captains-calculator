import { Action } from "state/_types";

export const saveNodes: Action = async ({ state, effects }) => {
    effects.saveLocalStorageNodes(state.recipes.nodes);
};
