# Rune Factory 4 — Guia de Dados (v3)

Este documento explica a estrutura de todos os arquivos JSON em `data/`,
como rastrear dados entre os arquivos, e como regenerar tudo.

---

## Convenção de Slug IDs

Cada entidade tem um **slug prefixado** que serve como ID único:

| Entidade     | Prefixo     | Exemplo                    |
| ------------ | ----------- | -------------------------- |
| Item         | `item-`     | `item-golden-cabbage`      |
| Receita      | `recipe-`   | `recipe-oil-flour-rice`    |
| Personagem   | `char-`     | `char-forte`               |
| Monstro      | `monster-`  | `monster-goblin-archer`    |
| Baú          | `chest-`    | `chest-14`                 |
| Ordem        | `order-`    | `order-airship-license`    |
| Skill        | `skill-`    | `skill-short-sword`        |
| Rune Ability | `rune-`     | `rune-power-wave`          |
| Festival     | `festival-` | `festival-cooking-contest` |
| Crop         | `crop-`     | `crop-turnip`              |
| Fish         | `fish-`     | `fish-masu-trout`          |
| Trophy       | `trophy-`   | `trophy-projector`         |

---

## Arquivos JSON

### 1. `items.json` — Registro Central (Hub)

**Formato:** `Object<slug, Item>` (1083 itens)

O arquivo central do dataset. Todos os outros arquivos apontam para itens usando o slug `item-*`.

| Campo            | Tipo      | Descrição                          |
| ---------------- | --------- | ---------------------------------- |
| `id`             | string    | `item-*` slug                      |
| `name`           | string    | Nome do item                       |
| `hexId`          | string    | ID hexadecimal interno             |
| `type`           | string    | Mineral, Crop, Dish, Fish, etc.    |
| `region`         | string    | Região onde encontrar              |
| `tier`           | number    | Nível/tier do item                 |
| `shippable`      | boolean   | Pode ser vendido/enviado           |
| `buy`            | number    | Preço de compra                    |
| `sell`           | number    | Preço de venda                     |
| `rarityPoints`   | number?   | Pontos de raridade (merged)        |
| `rarityCategory` | string?   | Categoria de raridade (merged)     |
| `usedInRecipes`  | string[]? | IDs de receitas que usam este item |
| `craftedFrom`    | object[]? | Receitas que produzem este item    |

---

### 2. `recipes.json` — Receitas

**Formato:** `Array<Recipe>` (614 receitas)

| Campo         | Tipo     | Descrição                             |
| ------------- | -------- | ------------------------------------- |
| `id`          | string   | `recipe-*` slug                       |
| `name`        | string   | Combo de ingredientes                 |
| `outputName`  | string   | Nome do item produzido                |
| `outputId`    | string   | Slug do item produzido → `items.json` |
| `hexId`       | string   | ID hex interno                        |
| `stationType` | string   | Cooking, Forging, Crafting, Chemistry |
| `station`     | string   | Frying Pan, Short Sword, etc.         |
| `level`       | number   | Nível necessário                      |
| `ingredients` | string[] | Slugs `item-*` → `items.json`         |

---

### 3. `characters.json` — Personagens & Presentes

**Formato:** `Object<slug, Character>` (30 personagens)

| Campo      | Tipo   | Descrição                                 |
| ---------- | ------ | ----------------------------------------- |
| `id`       | string | `char-*` slug                             |
| `name`     | string | Nome do personagem                        |
| `category` | string | Bachelorettes, Bachelors, Villagers, etc. |
| `gifts`    | object | Preferências de presente                  |

**Estrutura de `gifts`:**

```
gifts.love.items      → string[] (item-* slugs)
gifts.love.categories → string[] (nomes de categorias)
gifts.like.items      → string[]
gifts.like.categories → string[]
...
```

---

### 4. `monsters.json` — Monstros, Drops & Stats

**Formato:** `Object<slug, Monster>` (207 monstros)

| Campo         | Tipo    | Descrição                                                             |
| ------------- | ------- | --------------------------------------------------------------------- |
| `id`          | string  | `monster-*` slug                                                      |
| `name`        | string  | Nome                                                                  |
| `description` | string? | Descrição do monstro (nullable)                                       |
| `location`    | string? | Localização onde o monstro aparece (nullable)                         |
| `image`       | string? | Path relativo para imagem do monstro                                  |
| `drops`       | array   | `[{id, name, dropRate}]`                                              |
| `stats`       | object  | `{baseLevel?, exp, hp, atk, def, matk, mdef, str, vit, int, bonus?}` |
| `nickname`    | array?  | Array de nicknames possíveis                                          |
| `resistances` | object? | `{fire, water, earth, wind, light, dark, paralyze, ...}` (optional)   |
| `taming`      | object? | `{tameable, isRideable?, befriend?, favorite?, produce?, cycle?}`     |

---

### 5. `itemRarity.json` — Raridade

**Formato:** `Object<slug, Rarity>` (239 itens) — já merged em `items.json`

---

### 6. `cookingDetails.json` — Receitas de Culinária

**Seções:** `simple`, `fryingPan`, `pot`, `steamer`, `knife`, `mixer`, `oven`, `failedDish`

| Campo         | Tipo     | Descrição                         |
| ------------- | -------- | --------------------------------- |
| `id`          | string   | Slug do item                      |
| `name`        | string   | Nome da receita                   |
| `level`       | number   | Nível                             |
| `price`       | number   | Preço de venda                    |
| `ingredients` | string[] | Slugs `item-*`                    |
| `effects`     | object   | `{hp, hpMax, str, vit, int, ...}` |

---

### 7. `forgingDetails.json` — Armas & Ferramentas

**Seções:** `shortSwords`, `longSwords`, `spears`, `hammers`, `dualBlades`, `gloves`, `staves`, `hoe`, etc.

| Campo                | Tipo   | Descrição                    |
| -------------------- | ------ | ---------------------------- |
| `id`                 | string | Slug do item                 |
| `name`               | string | Nome                         |
| `level`              | number | Nível                        |
| `ingredientCategory` | string | Categoria de material        |
| `effects`            | object | `{atk, def, matk, str, ...}` |

---

### 8. `craftingDetails.json` — Armaduras & Acessórios

**Seções:** `accessories`, `shields`, `headgear`, `shoes`, `armor`

Mesma estrutura do `forgingDetails.json`.

---

### 9. `pharmacyDetails.json` — Poções & Medicamentos

**Seção:** `chemistrySet`

| Campo         | Tipo     | Descrição      |
| ------------- | -------- | -------------- |
| `id`          | string   | Slug do item   |
| `name`        | string   | Nome           |
| `level`       | number   | Nível          |
| `ingredients` | string[] | Slugs `item-*` |

---

### 10. `crops.json` — Cultivos

**Seções:** `regularCrops`, `giantCrops`, `seeds`, etc.

| Campo         | Tipo     | Descrição               |
| ------------- | -------- | ----------------------- |
| `id`          | string   | `crop-*` slug           |
| `name`        | string   | Nome                    |
| `itemId`      | string   | `item-*` → `items.json` |
| `goodSeasons` | string[] | `["Summer", "Fall"]`    |
| `badSeasons`  | string[] | `[]`                    |
| `growTime`    | number   | Dias para crescer       |
| `seedBuy`     | number   | Preço da semente        |
| `regrows`     | boolean  | Rebrota?                |

---

### 11. `fishing.json` — Peixes & Localizações

**Seções:** `fishByName`, `fishingRods`, `selphiaTown`, etc.

| Campo       | Tipo     | Descrição               |
| ----------- | -------- | ----------------------- |
| `id`        | string   | `fish-*` slug           |
| `itemId`    | string   | `item-*` → `items.json` |
| `locations` | string[] | Array de localizações   |

---

### 12-22. Outros Arquivos

| Arquivo               | Formato | Entradas  | Descrição                                                  |
| --------------------- | ------- | --------- | ---------------------------------------------------------- |
| `monstersWiki.json`   | Array   | ~1        | Stats wiki dos monstros, `weaknesses: []`, `locations: []` |
| `festivals.json`      | Array   | 28        | `{season, day, orderable, description}`                    |
| `skills.json`         | Array   | 6         | `{unlocks: {lv5, lv10, lv20}}`                             |
| `runeAbilities.json`  | Object  | 15 seções | `{weaponType, sell, buy, description}`                     |
| `statusAilments.json` | Object  | 2 seções  | `{stats: [...], ailments: [...]}`                          |
| `trophies.json`       | Object  | 3 seções  | `{description, requirements}`                              |
| `chests.json`         | Array   | 181       | `{itemId, region, tier, notes}`                            |
| `orders.json`         | Array   | 55        | `{orderName, category, requirement, rpCost}`               |
| `shippingList.json`   | Object  | 42 cats   | `{sell, buy, description}`                                 |
| `requests.json`       | Object  | 6 seções  | Quests & recompensas                                       |
| `townEvents.json`     | Array   | 35        | Eventos da cidade                                          |

---

## 🔗 Diagrama de Referência Cruzada

```
                         ┌──────────────────┐
                         │   items.json     │
                         │   (1083 itens)   │
                         │                  │
                         │   ★ HUB ★        │
                         └───────┬──────────┘
                                 │
           ┌─────────┬──────────┼──────────┬──────────┐
           ▼         ▼          ▼          ▼          ▼
     ┌──────────┐ ┌────────┐ ┌──────┐ ┌─────────┐ ┌─────────┐
     │ recipes  │ │ chars  │ │chests│ │monsters │ │ cooking │
     │ .json    │ │ .json  │ │.json │ │  .json  │ │ forging │
     │          │ │        │ │      │ │         │ │crafting │
     │outputId  │ │love.   │ │itemId│ │drops[]  │ │pharmacy │
     │→items    │ │items[] │ │→items│ │.id      │ │ .json   │
     │          │ │→items  │ │      │ │→items   │ │         │
     │ingredi-  │ │        │ │      │ │         │ │ingredi- │
     │ents[]    │ │        │ │      │ │produceId│ │ents[]   │
     │→items    │ │        │ │      │ │→items   │ │→items   │
     └──────────┘ └────────┘ └──────┘ └─────────┘ └─────────┘

     ┌──────────┐ ┌──────────┐ ┌───────────┐
     │  crops   │ │  fishing │ │ shipping  │
     │  .json   │ │  .json   │ │ List.json │
     │          │ │          │ │           │
     │ itemId   │ │  itemId  │ │   id      │
     │ →items   │ │  →items  │ │   →items  │
     └──────────┘ └──────────┘ └───────────┘
```

---

## Exemplos de Rastreamento

### Item → Receitas que o usam

```js
const items = await fetch("/data/items.json").then((r) => r.json());
const iron = items["item-iron"];
console.log(iron.usedInRecipes);
// → ["recipe-iron", "recipe-iron-spore", ...]
```

### Receita → Detalhes dos ingredientes

```js
const recipes = await fetch("/data/recipes.json").then((r) => r.json());
const items = await fetch("/data/items.json").then((r) => r.json());
const recipe = recipes.find((r) => r.outputName === "Antidote Potion");
const ingredientDetails = recipe.ingredients.map((slug) => items[slug]);
```

### Quem ama este item?

```js
const chars = await fetch("/data/characters.json").then((r) => r.json());
const lovers = Object.values(chars).filter((c) =>
  c.gifts.love.items.includes("item-chocolate-cake"),
);
```

### Monstro → Drops detalhados

```js
const monsters = await fetch("/data/monsters.json").then((r) => r.json());
const items = await fetch("/data/items.json").then((r) => r.json());
const goblin = monsters["monster-goblin-archer"];
const dropDetails = goblin.drops.map((d) => ({
  ...d,
  item: items[d.id],
}));
```

### Item → Localização de baú

```js
const chests = await fetch("/data/chests.json").then((r) => r.json());
const found = chests.filter((c) => c.itemId === "item-boiled-gyoza-recipe");
```

### Item → Stats de culinária

```js
const cooking = await fetch("/data/cookingDetails.json").then((r) => r.json());
for (const [section, recipes] of Object.entries(cooking)) {
  const match = recipes.find((r) => r.id === "item-baked-apple");
  if (match) console.log(section, match.effects);
}
```

---

## Tabela de Rastreamento Completa

| De → Para              | Caminho                                             |
| ---------------------- | --------------------------------------------------- |
| Item → Receitas        | `items[slug].usedInRecipes`                         |
| Item → Como craftar    | `items[slug].craftedFrom`                           |
| Item → Raridade        | `items[slug].rarityPoints`                          |
| Item → Quem ama        | `chars[*].gifts.love.items.includes(slug)`          |
| Item → Baús            | `chests.find(c => c.itemId === slug)`               |
| Item → Cooking         | `cookingDetails[section].find(r => r.id === slug)`  |
| Item → Weapon stats    | `forgingDetails[section].find(w => w.id === slug)`  |
| Item → Armor stats     | `craftingDetails[section].find(e => e.id === slug)` |
| Item → Drop source     | `monsters[*].drops.find(d => d.id === slug)`        |
| Item → Crop data       | `crops[section].find(c => c.itemId === slug)`       |
| Item → Fish data       | `fishing.fishByName.find(f => f.itemId === slug)`   |
| Item → Shipping        | `shippingList[cat].find(s => s.id === slug)`        |
| Receita → Ingredientes | `recipe.ingredients[]` → `items[slug]`              |
| Receita → Produto      | `recipe.outputId` → `items[slug]`                   |
| Personagem → Presentes | `char.gifts.love.items[]` → `items[slug]`           |
| Monstro → Drops        | `monster.drops[].id` → `items[slug]`                |
| Monstro → Produce      | `monster.taming.produceId` → `items[slug]`          |
| Baú → Item             | `chest.itemId` → `items[slug]`                      |
| Crop → Item            | `crop.itemId` → `items[slug]`                       |
| Fish → Item            | `fish.itemId` → `items[slug]`                       |

---

## Regenerar Dados

```sh
node scripts/extract-all.js
```

Gera todos os 22 arquivos JSON em `data/` em ~1 segundo.
