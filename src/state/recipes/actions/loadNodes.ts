import { AsyncAction } from "state/_types";
import ProductionNode from "../ProductionNode";

export const loadNodes: AsyncAction = async ({ state, effects }) => {
    const nodes = effects.loadLocalStorageNodes();
    if (nodes) {
        nodes.forEach(n => {
            const node = ProductionNode.fromJson(n, {
                recipes: state.recipes.items,
                machines: state.machines.items,
                categories: state.categories.items,
                products: state.products.items,
            });
            state.recipes.nodes[node.id] = node;
        });
    }
};
