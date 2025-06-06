import ProductionNode from '../ProductionNode';

export const saveLocalStorageNodes = (nodes: { [key: string]: ProductionNode }): void => {
    const serialized = Object.values(nodes).map(n => JSON.parse(n.toJson()));
    localStorage.setItem('app-nodes', JSON.stringify(serialized));
};
