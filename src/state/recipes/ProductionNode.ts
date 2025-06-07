import { Category, Machine, Product, Recipe, RecipeProduct } from "state/app/effects"
import { ProductRecipes } from "state/_types";
import { Edge }  from 'react-flow-renderer';
import { generateDarkColorHex } from "utils/colors";
import { RecipeNode } from "components/calculator/Editor";

type ProductionNodeParams = {
    recipe: Recipe;
    machine: Machine;
    category: Category;
    inputs: (Product & RecipeProduct)[];
    outputs: (Product & RecipeProduct)[];
    sources: ProductRecipes;
    targets: ProductRecipes;
}

export type SerializedProductionNode = {
    id: string;
    recipe: Recipe;
    machine: Machine;
    category: Category;
    inputs: RecipeIODictInput;
    outputs: RecipeIODictOutput;
    sources: ProductRecipes;
    targets: ProductRecipes;
    duration: number;
    machinesCount: number;
    updated: number;
}

export type RecipeIOImport =  {
    maxed: boolean;
    imported: number;
    imports: {
        source: string;
        quantity: number;
    }[]
}

export type RecipeIOExport =  {
    maxed: boolean;
    exported: number;
    exports: {
        target: string;
        quantity: number;
    }[]
}

export type RecipeIOImportProduct = Product & RecipeProduct & RecipeIOImport
export type RecipeIOExportProduct = Product & RecipeProduct & RecipeIOExport

export type RecipeIODictInput = {
    [index: string]: RecipeIOImportProduct
}

export type RecipeIODictOutput= {
    [index: string]: RecipeIOExportProduct
}

class ProductionNode {

    id: string;
    recipe: Recipe;
    machine: Machine;
    category: Category;

    inputs: RecipeIODictInput;
    outputs: RecipeIODictOutput;

    sources: ProductRecipes;
    targets: ProductRecipes;

    duration: number = 60;
    machinesCount: number = 0;
    updated: number = 0;

    constructor( { recipe, machine, category, inputs, outputs, sources, targets }: ProductionNodeParams ) {
        
        this.id = recipe.id + `_${Date.now()}`
        this.recipe = {...recipe}
        this.machine = {...machine}
        this.category = {...category}

        this.machinesCount = 1

        let inputProducts = inputs.reduce((items,item)=>({
            ...items, 
            [item.id]: {
                ...item,
                quantity: item.quantity,
                imported: 0,
                maxed: false,
                imports: []
            }
        }),{})

        let outputProducts = outputs.reduce((items,item)=>({
            ...items, 
            [item.id]: {
                ...item,
                quantity: item.quantity,
                exported: 0,
                maxed: false,
                exports: []
            }
        }),{})

        this.inputs = inputProducts
        this.outputs = outputProducts

        this.sources = sources
        this.targets = targets
    }

    calculateProduct60(originalDuration: number, quantity: number) {
        return (this.duration/originalDuration) * quantity
    }

    canImport(productId: string): boolean {
        return this.inputs.hasOwnProperty(productId) && !this.inputs[productId].maxed
    }

    canExport(productId: string): boolean {
        return this.outputs.hasOwnProperty(productId) && !this.outputs[productId].maxed
    }

    async removeExport(productId: string, targetRecipeId: string): Promise<void> {
        return new Promise(resolve=>{
            console.log('2',productId,targetRecipeId)
            let removedExports: RecipeIOExport['exports']  = []
            let remainingExports: RecipeIOExport['exports']  = []
            console.log('3',this.id)
            this.outputs[productId].exports.forEach(e=>{
                console.log('5',e.target,targetRecipeId)
                if (e.target===targetRecipeId) {
                    removedExports.push(e)
                    console.log('6',this.outputs[productId].exported, e.quantity)
                    this.outputs[productId].exported = this.outputs[productId].exported - e.quantity
                    console.log('7',this.outputs[productId].exported)
                } else {
                    remainingExports.push(e)
                }
            })
            this.outputs[productId].exports = remainingExports
            return resolve()
        })
    }

    addImport(productId: string, sourceRecipeId: string, importedQuantity: number): number | false {

        let amountToImport = 0

        // If Node Can Accept Input
        if (this.canImport(productId)) {

            let quantityNeeded = this.inputs[productId].quantity - this.inputs[productId].imported

            if (quantityNeeded>0) {

                if (quantityNeeded>=importedQuantity) {
                    amountToImport = importedQuantity
                } else {
                    amountToImport = quantityNeeded
                }
                
                this.inputs[productId].imports.push({
                    source: sourceRecipeId,
                    quantity: amountToImport
                })

                this.inputs[productId].imported += amountToImport

                if (this.inputs[productId].imported===this.inputs[productId].quantity) {
                    this.inputs[productId].maxed = true
                }

                this.updated = Date.now()

                // Return How Much We Are Importing
                return amountToImport

            }

        }

        // Return False, Can't Import
        return false

    }

    addExport(productId: string, targetRecipeId: string, exportedQuantity: number) {

        this.outputs[productId].exports.push({
            target: targetRecipeId,
            quantity: exportedQuantity
        })

        this.outputs[productId].exported += exportedQuantity

        if (this.outputs[productId].exported===this.outputs[productId].quantity) {
            this.outputs[productId].maxed = true
        }

    }

    toJson() {
        const data: SerializedProductionNode = {
            id: this.id,
            recipe: this.recipe,
            machine: this.machine,
            category: this.category,
            inputs: this.inputs,
            outputs: this.outputs,
            sources: this.sources,
            targets: this.targets,
            duration: this.duration,
            machinesCount: this.machinesCount,
            updated: this.updated,
        }
        return JSON.stringify(data)
    }

    static fromJson(
        json: SerializedProductionNode,
        data: {
            recipes: { [id: string]: Recipe };
            machines: { [id: string]: Machine };
            categories: { [id: string]: Category };
            products: { [id: string]: Product };
        }
    ): ProductionNode {
        const recipe = data.recipes[json.recipe.id] || json.recipe;
        const machine = data.machines[recipe.machine] || json.machine;
        const category = data.categories[machine.category_id] || json.category;

        const inputs = recipe.inputs.map(({ id, quantity }) => ({
            ...data.products[id],
            quantity,
        }));

        const outputs = recipe.outputs.map(({ id, quantity }) => ({
            ...data.products[id],
            quantity,
        }));

        const node = new ProductionNode({
            recipe,
            machine,
            category,
            inputs,
            outputs,
            sources: json.sources,
            targets: json.targets,
        });

        node.id = json.id;
        node.duration = json.duration;
        node.machinesCount = json.machinesCount;
        node.updated = json.updated;

        Object.keys(node.inputs).forEach(pid => {
            if (json.inputs && json.inputs[pid]) {
                node.inputs[pid].imported = json.inputs[pid].imported;
                node.inputs[pid].imports = json.inputs[pid].imports;
                node.inputs[pid].maxed = json.inputs[pid].maxed;
            }
        });

        Object.keys(node.outputs).forEach(pid => {
            if (json.outputs && json.outputs[pid]) {
                node.outputs[pid].exported = json.outputs[pid].exported;
                node.outputs[pid].exports = json.outputs[pid].exports;
                node.outputs[pid].maxed = json.outputs[pid].maxed;
            }
        });

        return node;
    }

    get nodeData(): RecipeNode[] {
        let mainNode = {
            id: this.id,
            type: 'RecipeNode',
            data: this,
            position: { x: 0, y: 0 }
        }
        return [ mainNode ]
    }

    get edgeData(): Edge<any>[] {
        let edges: Edge<any>[] = []

        Object.values(this.inputs).forEach(input=>{
            input.imports.forEach(item=>{
                edges.push({
                    id: `${item.source}-${this.id}`,
                    source: item.source,
                    sourceHandle: `${item.source}-${input.id}-output`,
                    target: this.id,
                    targetHandle: `${this.id}-${input.id}-input`,
                    style: { stroke: generateDarkColorHex(), strokeWidth: 3 }
                })
            })
        })
        return edges
    }

}

export default ProductionNode