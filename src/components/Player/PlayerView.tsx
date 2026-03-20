import {
  useOrders,
  useRequests,
  useRuneAbilities,
  useSkills,
  useTrophies,
} from "@/hooks/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Shield,
  Coins,
  CheckSquare,
  Swords,
  Sparkles,
  BookOpen,
} from "lucide-react";
import type { SkillsData } from "@/lib/schemas";

const runeAbilityImages = import.meta.glob(
  "@/assets/images/rune-abilities/*.png",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

const resolveRuneAbilityImage = (image?: string) => {
  if (!image) return undefined;
  return runeAbilityImages[`/src/assets/images/${image}`];
};

const SKILL_CATEGORY_ORDER: Array<keyof SkillsData> = [
  "weapons",
  "magic",
  "farming",
  "recipe",
  "life",
  "defense",
  "other",
];

const SKILL_CATEGORY_LABELS: Record<keyof SkillsData, string> = {
  weapons: "Weapon Skills",
  magic: "Magic Skills",
  farming: "Farming Skills",
  recipe: "Recipe Skills",
  life: "Life Skills",
  defense: "Defense Skills",
  other: "Other Skills",
};

export function PlayerView() {
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const { data: requestsData, isLoading: isLoadingReqs } = useRequests();
  const { data: runeAbilitiesData, isLoading: isLoadingRunes } =
    useRuneAbilities();
  const { data: skills, isLoading: isLoadingSkills } = useSkills();
  const { data: trophiesData, isLoading: isLoadingTrophies } = useTrophies();

  const isLoading =
    isLoadingOrders ||
    isLoadingReqs ||
    isLoadingRunes ||
    isLoadingSkills ||
    isLoadingTrophies;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading player data...
      </div>
    );
  }

  // Flatten trophies
  const allTrophies = Object.values(trophiesData || {}).flat();

  // Flatten requests
  const repeatableReqs = requestsData?.repeatableRequests || [];
  const oneTimeReqs = [
    ...(requestsData?.itemrecipeRewards || []),
    ...(requestsData?.generalStoreSeedRewards || []),
    ...(requestsData?.carnationStoreSeedRewards || []),
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-muted/20">
      <div className="flex items-center gap-3 p-6 pb-2 shrink-0">
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Player Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your progression, orders, requests, and trophies.
          </p>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 p-6 pt-0 w-full">
        <div className="flex flex-col min-h-0 h-full bg-background border rounded-xl shadow-sm overflow-hidden">
          <Tabs
            defaultValue="orders"
            className="flex flex-col h-full w-full min-h-0"
          >
            <div className="p-2 border-b shrink-0 overflow-x-auto">
              <TabsList className="flex w-max min-w-full justify-start h-auto">
                <TabsTrigger
                  value="orders"
                  className="py-2.5 px-4 min-w-[120px]"
                >
                  <Coins className="w-4 h-4 mr-2" /> Orders
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="py-2.5 px-4 min-w-[120px]"
                >
                  <CheckSquare className="w-4 h-4 mr-2" /> Requests
                </TabsTrigger>
                <TabsTrigger
                  value="rune-abilities"
                  className="py-2.5 px-4 min-w-[150px]"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Rune Abilities
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="py-2.5 px-4 min-w-[120px]"
                >
                  <Swords className="w-4 h-4 mr-2" /> Skills
                </TabsTrigger>
                <TabsTrigger
                  value="trophies"
                  className="py-2.5 px-4 min-w-[120px]"
                >
                  <Trophy className="w-4 h-4 mr-2" /> Trophies
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4">
                <TabsContent value="orders" className="m-0 mt-2 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {orders?.map((order) => (
                      <Card
                        key={order.id}
                        className="py-0 hover:border-primary/50 transition-colors h-full flex flex-col"
                      >
                        <CardHeader className="p-4 pb-2 space-y-0">
                          <CardTitle className="text-lg">
                            {order.orderName}
                          </CardTitle>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary">{order.category}</Badge>
                            {order.rpCost && (
                              <Badge
                                variant="outline"
                                className="text-blue-600 border-blue-200 bg-blue-50"
                              >
                                Cost: {order.rpCost} RP
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 text-sm text-muted-foreground flex-1">
                          {order.requirement && (
                            <p>
                              <span className="font-semibold text-foreground">
                                Req:
                              </span>{" "}
                              {order.requirement}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="requests" className="m-0 mt-2 space-y-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" /> Standard
                      Requests
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {oneTimeReqs.map((req, i) => (
                        <Card
                          key={i}
                          className="py-0 hover:border-primary/50 transition-colors h-full flex flex-col"
                        >
                          <CardHeader className="p-4 pb-2 space-y-0">
                            <CardTitle className="text-lg leading-tight">
                              {req.request}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 gap-2 text-sm flex flex-col flex-1 justify-between">
                            <div className="space-y-2">
                              {(req.unlockConditions || req.condition) && (
                                <div>
                                  <span className="font-semibold block">
                                    Unlock Condition:
                                  </span>
                                  <span className="text-muted-foreground">
                                    {req.unlockConditions || req.condition}
                                  </span>
                                </div>
                              )}
                              {req.howToComplete && (
                                <div>
                                  <span className="font-semibold block">
                                    How to complete:
                                  </span>
                                  <span className="text-muted-foreground">
                                    {req.howToComplete}
                                  </span>
                                </div>
                              )}
                            </div>
                            {req.reward && (
                              <div className="p-2 mt-auto rounded bg-amber-500/10 text-amber-800 border border-amber-500/20">
                                <span className="font-semibold">Reward:</span>{" "}
                                {req.reward}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" />{" "}
                      Repeatable Requests
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {repeatableReqs.map((req, i) => (
                        <Card key={i} className="py-0 h-full flex flex-col">
                          <CardHeader className="p-4 pb-2 space-y-0">
                            <CardTitle className="text-lg">
                              {req.request}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 gap-2 text-sm flex flex-col flex-1">
                            <p className="text-muted-foreground flex-1">
                              {req.howToComplete}
                            </p>
                            <div className="mt-auto">
                              <Badge variant="secondary">
                                {req.reward} Reward
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="rune-abilities"
                  className="m-0 mt-2 space-y-8"
                >
                  {runeAbilitiesData &&
                    Object.entries(runeAbilitiesData).map(
                      ([category, abilities]) => (
                        <div key={category}>
                          <h3 className="text-xl font-bold mb-4 capitalize border-b pb-2 text-purple-600">
                            {category}
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {abilities.map((ability, i) => (
                              <Card
                                key={i}
                                className="py-0 h-full flex flex-col"
                              >
                                <CardHeader className="p-4 pb-2">
                                  <div className="flex min-h-6 items-center gap-3">
                                    {resolveRuneAbilityImage(ability.image) && (
                                      <img
                                        src={resolveRuneAbilityImage(ability.image)}
                                        alt={ability.name}
                                        className="block h-6 w-6 shrink-0 object-contain"
                                        loading="lazy"
                                      />
                                    )}
                                    <CardTitle className="text-base leading-none">
                                      {ability.name}
                                    </CardTitle>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 gap-2 text-sm flex flex-col flex-1">
                                  <p className="text-muted-foreground flex-1">
                                    {ability.description}
                                  </p>
                                  {(ability.buy || ability.sell) && (
                                    <div className="flex gap-2 mt-auto pt-2">
                                      {ability.buy && (
                                        <Badge
                                          variant="outline"
                                          className="text-green-600"
                                        >
                                          Buy: {ability.buy}
                                        </Badge>
                                      )}
                                      {ability.sell && (
                                        <Badge
                                          variant="outline"
                                          className="text-red-600"
                                        >
                                          Sell: {ability.sell}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                </TabsContent>

                <TabsContent value="skills" className="m-0 mt-2 space-y-4">
                  {skills &&
                    SKILL_CATEGORY_ORDER.map((category) => {
                      const categorySkills = skills[category];

                      if (categorySkills.length === 0) {
                        return null;
                      }

                      return (
                        <div key={category} className="space-y-4">
                          <h3 className="text-xl font-bold border-b pb-2">
                            {SKILL_CATEGORY_LABELS[category]}
                          </h3>

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {categorySkills.map((skill) => (
                              <Card
                                key={skill.id}
                                className="py-0 overflow-hidden flex flex-col h-full"
                              >
                                <CardHeader className="bg-slate-50 border-b p-4 pb-3 space-y-0">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-slate-500" />
                                    {skill.name}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4 flex flex-col flex-1">
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {skill.description}
                                  </p>

                                  {skill.bonuses.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
                                        Bonuses
                                      </h4>
                                      <div className="space-y-2">
                                        {skill.bonuses.map((bonus) => (
                                          <div
                                            key={`${skill.id}-${bonus.kind}-${bonus.description}`}
                                            className="rounded border bg-slate-50 p-3 text-sm"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Badge variant="secondary">
                                                {bonus.kind}
                                              </Badge>
                                              {bonus.stats.length > 0 && (
                                                <span className="text-xs text-slate-500">
                                                  {bonus.stats.join(", ")}
                                                </span>
                                              )}
                                            </div>
                                            <p className="mt-2 text-muted-foreground">
                                              {bonus.description}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {skill.unlocks.length > 0 && (
                                    <div className="pt-2 mt-auto">
                                      <h4 className="font-semibold text-xs uppercase tracking-wider mb-2 text-slate-500">
                                        Unlocks
                                      </h4>
                                      <div className="space-y-2">
                                        {skill.unlocks.map((unlock) => (
                                          <div
                                            key={`${skill.id}-${unlock.level}`}
                                            className="flex justify-between items-center text-sm p-2 rounded bg-slate-50 border gap-2"
                                          >
                                            <Badge
                                              variant="secondary"
                                              className="font-mono shrink-0"
                                            >
                                              Lv. {unlock.level}
                                            </Badge>
                                            <span className="font-medium text-slate-700 text-right">
                                              {unlock.effect}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </TabsContent>

                <TabsContent value="trophies" className="m-0 mt-2 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {allTrophies.map((trophy) => (
                      <Card
                        key={trophy.id}
                        className="py-0 overflow-hidden bg-amber-500/5 border-amber-200 hover:border-amber-400 transition-colors flex flex-col h-full"
                      >
                        <CardHeader className="bg-amber-500/10 border-b border-amber-200/50 p-4 pb-3 space-y-0">
                          <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-600" />
                            {trophy.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col flex-1">
                          <p className="text-sm text-amber-800/80 mb-4 flex-1">
                            {trophy.description}
                          </p>
                          {trophy.requirements && (
                            <div className="text-xs pt-3 mt-auto border-t border-amber-200/50">
                              <span className="font-semibold text-amber-900">
                                Req:
                              </span>{" "}
                              <span className="text-amber-800">
                                {trophy.requirements}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
