---
seo:
  title: Goodie Forms - An unopinionated modern form state and data management library
  description: 
    Goodie Forms is a modern, unopinionated form state and data management library for TypeScript apps. 
    Create flexible, type-safe forms with complete control over validation and state.
---

::u-page-hero
#title
<IndexLogo/>

#description
An unopinionated modern form state and data management library

#links
<div class="flex flex-col items-center gap-6">
  <div class="flex item-center gap-4">

    :::u-button
    ---
    color: neutral
    size: xl
    to: /core/quick-start
    trailing-icon: i-lucide-arrow-right
    ---
    Get started
    :::

    :::u-button
    ---
    color: neutral
    size: xl
    to: /react/quick-start
    trailing-icon: mdi:react
    ---
    Get started with React
    :::

    :::u-button
    ---
    color: neutral
    size: xl
    to: /vue/introduction
    trailing-icon: mdi:vuejs
    ---
    Get started with Vue
    :::

  </div>

  <div class="flex item-center gap-4">

    :::u-button
    ---
    color: neutral
    icon: simple-icons-github
    size: xl
    to: https://github.com/iGoodie/goodie-forms
    variant: outline
    ---
    Star on GitHub
    :::

    :::u-button
    ---
    color: neutral
    icon: simple-icons-github
    size: xl
    to: https://github.com/iGoodie/goodie-forms/fork
    variant: outline
    ---
    Contribute on GitHub
    :::

  </div>

</div>

::

::u-page-section
#title
Core Features

#features
:::card{class="my-0!"}
---
title: Headless Core
icon: noto:brain
---
Pure logic. Zero UI assumptions.
The core handles state, validation, and field orchestration — rendering is entirely your responsibility.
:::

:::card{class="my-0!"}
---
title: Single Source of Truth
icon: noto:building-construction
---
Form state lives in one canonical object.
No duplicated mirrors, no hidden caches, no divergence between “view state” and “data state”.
:::

:::card{class="my-0!"}
---
title: Explicity Over Implicit Magic
icon: noto:top-hat
---
No hidden proxies, no auto-registration side effects.
Every field, mutation, and validation step is deliberate and traceable.
:::

:::card{class="my-0!"}
---
title: Isolation/Modularization
icon: noto:puzzle-piece
---
Core logic, framework bindings, and utilities are separated by design.
Each layer can evolve independently without leaking abstractions.
:::

:::card{class="my-0!"}
---
title: Type Safety Focused
icon: noto:locked-with-key
---
Deep path inference, compile-time validation, and structural guarantees.
If a field path compiles, it exists.
:::

:::card{class="my-0!"}
---
title: Opt-in Standard Validation
icon: noto:test-tube
---
Validation is pluggable and schema-driven.
Adopt [`StandardSchemaV1`](https://standardschema.dev/) when needed — stay lightweight when not.
:::

:::card{class="my-0!"}
---
title: Determinism Over Convenience
icon: noto:triangular-ruler
---
No surprising mutations. No implicit resets.
Given the same inputs, the system behaves the same way — always.
:::

:::card{class="my-0!"}
---
title: Framework-Agnostic
icon: noto:globe-showing-asia-australia
---
Works with [React](https://react.dev/), [Vue](https://vuejs.org/), or anything else.
The core does not depend on a rendering model.
:::

:::card{class="my-0!"}
---
title: Battle-Tested
icon: noto:crossed-swords
---
Used in complex, deeply nested, dynamic form scenarios.
Designed to handle real-world edge cases without collapsing under scale.
:::
::

::u-page-section
#title
Available For

#features
:::u-page-feature
---
icon: mdi:language-javascript
target: _blank
to: https://www.npmjs.com/package/@goodie-forms/core
---

#title
@goodie-form/core [JavaScript]{.text-primary}

#description
With FormController, it is possible to manage your form states and attach DOM elements.
:::

:::u-page-feature
---
icon: mdi:react
target: _blank
to: https://www.npmjs.com/package/@goodie-forms/react
---

#title
@goodie-form/react - [React]{.text-primary}

#description
With exposed hooks, it is possible to use Goodie Forms without leaving your React environment.
:::

:::u-page-feature
---
icon: mdi:vuejs
target: _blank
to: https://www.npmjs.com/package/@goodie-forms/vue
---

#title
@goodie-form/vue - [Vue]{.text-primary}

#description
\[WIP] Not available yet.
:::
::

