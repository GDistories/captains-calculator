import { SerializedProductionNode } from '../ProductionNode';

export const loadLocalStorageNodes = (): SerializedProductionNode[] | null => {
    const data = localStorage.getItem('app-nodes');
    return data ? JSON.parse(data) : null;
};
