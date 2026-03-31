import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CrafterData } from '@/lib/schemas';
import { CrafterItemSlot } from './CrafterItemSlot';
import { getNodePreviewData } from './crafterNodeBehavior';
import type { CrafterGridNode } from './crafterTypes';

type CrafterEquipmentTabProps = {
  activeBaseNode?: CrafterGridNode;
  activeRecipeNodes: CrafterGridNode[];
  activeInheritNodes: CrafterGridNode[];
  activeUpgradeNodes: CrafterGridNode[];
  crafterData: CrafterData;
  onSelectNode: (node: CrafterGridNode) => void;
};

function renderSlotSection(
  title: string,
  badgeLabel: string,
  nodes: CrafterGridNode[],
  caption: (node: CrafterGridNode) => string,
  onSelectNode: (node: CrafterGridNode) => void,
  crafterData: CrafterData,
) {
  return (
    <Card className="rounded-2xl bg-card/90 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary">{badgeLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-1">
          <div className="inline-grid w-fit min-w-fit grid-cols-3 gap-4">
            {nodes.map((node) => (
              <CrafterItemSlot
                key={node.id}
                node={node}
                caption={caption(node)}
                previewData={getNodePreviewData(node, node.item, node.itemId, crafterData)}
                onClick={() => onSelectNode(node)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CrafterEquipmentTab({
  activeBaseNode,
  activeRecipeNodes,
  activeInheritNodes,
  activeUpgradeNodes,
  crafterData,
  onSelectNode,
}: CrafterEquipmentTabProps) {
  return (
    <>
      <Card className="rounded-2xl bg-card/90 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Base</CardTitle>
          <CardDescription>
            Set the crafted base item and supporting recipe slots for this equipment piece.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <div className="flex w-fit min-w-fit items-center gap-4">
              {activeBaseNode ? (
                <CrafterItemSlot
                  node={activeBaseNode}
                  caption="Base Item"
                  previewData={getNodePreviewData(activeBaseNode, activeBaseNode.item, activeBaseNode.itemId, crafterData)}
                  onClick={() => onSelectNode(activeBaseNode)}
                />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {renderSlotSection(
        'Recipe Slots',
        `${activeRecipeNodes.filter((node) => node.itemId).length}/${activeRecipeNodes.length}`,
        activeRecipeNodes,
        (node) => `Recipe ${Number(node.index ?? 0) + 1}`,
        onSelectNode,
        crafterData,
      )}

      {renderSlotSection(
        'Inherit Slots',
        `${activeInheritNodes.filter((node) => node.itemId).length}/${activeInheritNodes.length}`,
        activeInheritNodes,
        (node) => `Inherit ${Number(node.index ?? 0) + 1}`,
        onSelectNode,
        crafterData,
      )}

      {renderSlotSection(
        'Upgrade Slots',
        `${activeUpgradeNodes.filter((node) => node.itemId).length}/${activeUpgradeNodes.length}`,
        activeUpgradeNodes,
        (node) => `+${Number(node.index ?? 0) + 1}`,
        onSelectNode,
        crafterData,
      )}
    </>
  );
}
