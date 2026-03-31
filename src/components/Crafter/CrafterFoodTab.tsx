import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CrafterData } from '@/lib/schemas';
import { CrafterItemSlot } from './CrafterItemSlot';
import { getNodePreviewData } from './crafterNodeBehavior';
import type { CrafterGridNode } from './crafterTypes';

type CrafterFoodTabProps = {
  cookingBaseNode?: CrafterGridNode;
  activeRecipeNodes: CrafterGridNode[];
  crafterData: CrafterData;
  onSelectNode: (node: CrafterGridNode) => void;
};

export function CrafterFoodTab({
  cookingBaseNode,
  activeRecipeNodes,
  crafterData,
  onSelectNode,
}: CrafterFoodTabProps) {
  return (
    <Card className="rounded-2xl bg-card/90 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Dish Selection</CardTitle>
        <CardDescription>
          Select the base dish and refine its ingredient slots with the same compact planning flow used for equipment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {cookingBaseNode ? (
          <div className="overflow-x-auto pb-1">
            <div className="flex w-fit min-w-fit items-center gap-4">
              <CrafterItemSlot
                node={cookingBaseNode}
                caption="Base Food"
                previewData={getNodePreviewData(cookingBaseNode, cookingBaseNode.item, cookingBaseNode.itemId, crafterData)}
                onClick={() => onSelectNode(cookingBaseNode)}
              />
            </div>
          </div>
        ) : null}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Ingredients</div>
            <Badge variant="secondary">{activeRecipeNodes.filter((node) => node.itemId).length}/{activeRecipeNodes.length}</Badge>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="inline-grid w-fit min-w-fit grid-cols-3 gap-4">
              {activeRecipeNodes.map((node) => (
                <CrafterItemSlot
                  key={node.id}
                  node={node}
                  caption={`Recipe ${Number(node.index ?? 0) + 1}`}
                  previewData={getNodePreviewData(node, node.item, node.itemId, crafterData)}
                  onClick={() => onSelectNode(node)}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
