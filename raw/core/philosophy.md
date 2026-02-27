# Philosophy

> The architectural principles behind Goodie Forms

**Goodie Forms** is built on a simple premise:

> Forms are state machines — not UI framework state.

*Most form libraries* **tightly couple** their logic to a **specific framework**.
Goodie Forms does not. Instead, it **separates concerns** clearly:

- <icon className="size-5,text-secondary" name="material-symbols:readiness-score-outline">



</icon>

 A **framework-agnostic core** handles **state**, **validation**, **paths**, and **events**.
- <icon className="size-5,text-secondary" name="tabler:layout-board-split">



</icon>

 **UI bindings** (*React*, *Vue*, or *any future adapter*) act purely as **subscription layers**.

The form engine **exists independently** from how it is **rendered**.

---

## 🧠 Headless by Design

<doc-ref-section>

At the center of **Goodie Forms** is the `FormController`. It is:

- **Framework-independent**
- **Event-driven**
- **Deterministic**
- **Fully typed**

It **does not depend** on hooks.
<br />


It **does not assume** a rendering model.
<br />


It **does not mirror** state into any framework.

This ensures:

- The core remains **portable across ecosystems**
- Business logic is **testable without UI**
- Behavior stays consistent **regardless of rendering strategy**
- New framework adapters can be implemented **without rewriting the engine**

**UI integrations** are intentionally **thin bridges** — *nothing more.*

</doc-ref-section>

## 🏗️ The Controller Owns the State

<doc-ref-section>

In many **form systems**, UI frameworks become the **state container**. This often leads to:

- **Duplicated state**
- Excessive **re-renders**
- **Tight coupling** between **rendering** and **data**
- **Implicit mutation flows**

**Goodie Forms** flips that model. The **controller** owns **the data**. **Frameworks** subscribe to it. There is:

- ❌ **No mirrored framework state**
- ❌ **No hidden synchronization layers**
- ❌ **No dependency on a specific rendering paradigm**

**Rendering** is an **effect** of **subscription** — *not the driver of state.*

</doc-ref-section>

## 🧙‍♂️ Explicit Reactivity Over Implicit Magic

<doc-ref-section>

**Magic abstractions** feel productive **early on**. They become **fragile** at **scale**. **Goodie Forms** favors:

- **Explicit subscriptions**
- **Clear mutation flows**
- **Predictable event boundaries**
- **Deterministic validation timing**

If something **updates**, **you know why**.
<br />


If validation **runs**, **you know when**.
<br />


If a **component reacts**, **it does so intentionally**.

- ❌ **No hidden proxies.**
- ❌ **No implicit dependency tracking.**
- ❌ **No runtime heuristics.**

Just **events** and **subscriptions**.

</doc-ref-section>

## 🧩 Isolation is the Default

<doc-ref-section>

*Large forms* **fail** when:

- **State changes** cascade **unpredictably**
- **Validation leaks** across **unrelated fields**
- **Performance degrades** as **complexity grows**

**Goodie Forms** isolates by **architecture**. Each field:

- Has its **own state slice**
- Emits **scoped events**
- Can be **observed independently**
- Cleans up **safely when detached**

Whether you **render 3 fields or 300**, the behavior **remains predictable**.

**Scalability is structural** — *not achieved through patchwork optimizations.*

</doc-ref-section>

## 🔐 Type Safety is Structural

<doc-ref-section>

**Type safety** is **not a layer** added **on top**. It is **embedded** into the **architecture**. **Goodie Forms** provides:

- **Deep path inference**
- **Compile-time path validation**
- **Accurate nested type resolution**
- **Strongly typed controller APIs**

**Types** guide **the design** rather than **decorate it**.

This **reduces runtime errors** and **eliminates entire classes of invalid state transitions**.

</doc-ref-section>

## 🧪 Validation is a Lifecycle

<doc-ref-section>

**Validation** is treated as a **structured lifecycle**, not an **incidental side-effect**. It is:

- **Scheduled intentionally**
- **Triggered by explicit strategies**
- **Emitted through structured events**
- **Separated from rendering concerns**

This **avoids race conditions**, **inconsistent timing**, and **duplicated validation logic**.

**Validation** becomes **predictable** — *even in complex flows.*

</doc-ref-section>

## 📐 Determinism Over Convenience

<doc-ref-section>

Goodie Forms **avoids patterns** that:

- **Hide complexity behind convenience**
- **Duplicate state across layers**
- **Blur responsibility boundaries**

Instead, it **embraces**:

- **Single source of truth**
- **Stable controller instances**
- **Explicit APIs**
- **Event-driven updates**

The goal is **not fewer lines of code**.
<br />


The goal is **fewer surprises**.

</doc-ref-section>

## 🌍 Framework-Agnostic by Architecture

<doc-ref-section>

Because **the engine** is **independent**:

- It can **power multiple UI bindings**
- It can **be tested without rendering**
- It can **run outside component trees**
- It can **integrate with non-UI workflows**

**The UI layer** is **optional**.
**The state machine** is **fundamental**.

</doc-ref-section>
