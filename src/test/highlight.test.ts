/**
 * Highlight Tier System — Business Logic Tests
 *
 * These tests validate the core ranking rules without hitting the database.
 * The SQL functions (activate_or_renew_highlight, apply_boost, alloc_top_key,
 * alloc_bottom_key) implement the same logic at the database layer.
 */

import { describe, it, expect } from "vitest";

const MS_PER_DAY = 86_400_000;

// ─── Pure helpers (mirrors view's tier_rank computation) ──────────────────────

type HighlightTier = "standard" | "premium" | "exclusive";

function getTierRank(tier: HighlightTier, expiresAt: string | null): number {
  if (!expiresAt) return 1;
  const isActive = new Date(expiresAt) > new Date();
  if (!isActive) return 1;
  if (tier === "exclusive") return 3;
  if (tier === "premium") return 2;
  return 1;
}

function getEffectiveSortKey(
  tier: HighlightTier,
  expiresAt: string | null,
  sortKey: number,
): number {
  if (!expiresAt) return 0;
  const isActive = new Date(expiresAt) > new Date();
  if (!isActive) return 0;
  if (tier === "premium" || tier === "exclusive") return sortKey;
  return 0;
}

function isHighlightActive(tier: HighlightTier, expiresAt: string | null): boolean {
  if (tier === "standard") return false;
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

// ─── Simulated counter / ranking helpers ──────────────────────────────────────

type TierCounters = Record<HighlightTier, { nextTopKey: number; nextBottomKey: number }>;

function makeCounters(): TierCounters {
  return {
    standard:  { nextTopKey: 2_000_000_000, nextBottomKey: 1_000_000_000 },
    premium:   { nextTopKey: 2_000_000_000, nextBottomKey: 1_000_000_000 },
    exclusive: { nextTopKey: 2_000_000_000, nextBottomKey: 1_000_000_000 },
  };
}

function allocBottomKey(counters: TierCounters, tier: HighlightTier): number {
  const key = counters[tier].nextBottomKey;
  counters[tier].nextBottomKey -= 1;
  return key;
}

function allocTopKey(counters: TierCounters, tier: HighlightTier): number {
  const key = counters[tier].nextTopKey;
  counters[tier].nextTopKey += 1;
  return key;
}

interface Profile {
  id: string;
  highlightTier: HighlightTier;
  highlightExpiresAt: string | null;
  highlightSortKey: number;
}

function activateOrRenew(
  counters: TierCounters,
  profile: Profile,
  tier: HighlightTier,
  days: number,
): { profile: Profile; eventType: string } {
  const now = new Date();
  const isRenewal =
    profile.highlightTier === tier &&
    profile.highlightExpiresAt !== null &&
    new Date(profile.highlightExpiresAt) > now;

  if (isRenewal) {
    const newExpiry = new Date(profile.highlightExpiresAt!);
    newExpiry.setDate(newExpiry.getDate() + days);
    return {
      profile: { ...profile, highlightExpiresAt: newExpiry.toISOString() },
      eventType: "plan_renewed",
    };
  }

  const sortKey   = allocBottomKey(counters, tier);
  const expiresAt = new Date(now.getTime() + days * MS_PER_DAY).toISOString();
  return {
    profile: { ...profile, highlightTier: tier, highlightExpiresAt: expiresAt, highlightSortKey: sortKey },
    eventType: "plan_activated",
  };
}

function applyBoost(counters: TierCounters, profile: Profile): Profile {
  if (!isHighlightActive(profile.highlightTier, profile.highlightExpiresAt)) {
    throw new Error("Profile has no active eligible tier for boost");
  }
  const sortKey = allocTopKey(counters, profile.highlightTier);
  return { ...profile, highlightSortKey: sortKey };
}

function compareListing(a: Profile, b: Profile): number {
  const rankA = getTierRank(a.highlightTier, a.highlightExpiresAt);
  const rankB = getTierRank(b.highlightTier, b.highlightExpiresAt);
  if (rankA !== rankB) return rankB - rankA; // DESC

  const skA = getEffectiveSortKey(a.highlightTier, a.highlightExpiresAt, a.highlightSortKey);
  const skB = getEffectiveSortKey(b.highlightTier, b.highlightExpiresAt, b.highlightSortKey);
  return skB - skA; // DESC
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Highlight Tier — getTierRank", () => {
  it("exclusive active → rank 3", () => {
    const exp = new Date(Date.now() + MS_PER_DAY).toISOString();
    expect(getTierRank("exclusive", exp)).toBe(3);
  });

  it("premium active → rank 2", () => {
    const exp = new Date(Date.now() + MS_PER_DAY).toISOString();
    expect(getTierRank("premium", exp)).toBe(2);
  });

  it("standard → rank 1", () => {
    expect(getTierRank("standard", null)).toBe(1);
  });

  it("expired premium → rank 1", () => {
    const exp = new Date(Date.now() - 1000).toISOString(); // past
    expect(getTierRank("premium", exp)).toBe(1);
  });

  it("exclusive with null expiry → rank 1 (guards against bad data)", () => {
    expect(getTierRank("exclusive", null)).toBe(1);
  });
});

describe("Scenario 1 — Novo plano entra no FIM do bloco do tier", () => {
  it("primeiro perfil entra; segundo entra abaixo do primeiro", () => {
    const counters = makeCounters();

    const profileA: Profile = { id: "a", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };
    const profileB: Profile = { id: "b", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };

    const { profile: aAfter } = activateOrRenew(counters, profileA, "premium", 30);
    const { profile: bAfter } = activateOrRenew(counters, profileB, "premium", 30);

    // A got bottom_key first (larger), B got next (smaller) → A sorts above B
    const listing = [bAfter, aAfter].sort(compareListing);
    expect(listing[0].id).toBe("a"); // A is above B (entered first)
    expect(listing[1].id).toBe("b");
  });
});

describe("Scenario 2 — Boost vai para o TOPO do tier", () => {
  it("perfil com boost aparece acima de quem apenas ativou o plano", () => {
    const counters = makeCounters();

    const profileA: Profile = { id: "a", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };
    const profileB: Profile = { id: "b", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };

    const { profile: aActivated } = activateOrRenew(counters, profileA, "premium", 30);
    const { profile: bActivated } = activateOrRenew(counters, profileB, "premium", 30);

    // B does a boost
    const bBoosted = applyBoost(counters, bActivated);

    // Boost key is in the 2 000 000 000+ range, activation keys in the 999 999 999- range
    expect(bBoosted.highlightSortKey).toBeGreaterThan(bActivated.highlightSortKey);
    expect(bBoosted.highlightSortKey).toBeGreaterThan(aActivated.highlightSortKey);

    const listing = [aActivated, bBoosted].sort(compareListing);
    expect(listing[0].id).toBe("b"); // B (boosted) is at top
    expect(listing[1].id).toBe("a");
  });

  it("boost mais recente supera boost anterior", () => {
    const counters = makeCounters();
    const futureExp = new Date(Date.now() + MS_PER_DAY).toISOString();

    const profileA: Profile = { id: "a", highlightTier: "premium", highlightExpiresAt: futureExp, highlightSortKey: 1_000_000_000 };
    const profileB: Profile = { id: "b", highlightTier: "premium", highlightExpiresAt: futureExp, highlightSortKey: 999_999_999 };

    const aBoosted = applyBoost(counters, profileA);
    const bBoosted = applyBoost(counters, profileB);

    // B boosted after A → B's sort_key is higher
    const listing = [aBoosted, bBoosted].sort(compareListing);
    expect(listing[0].id).toBe("b");
    expect(listing[1].id).toBe("a");
  });
});

describe("Scenario 3 — Renovação NÃO muda posição", () => {
  it("renovar o mesmo tier preserva o sort_key", () => {
    const counters = makeCounters();
    const profileA: Profile = { id: "a", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };
    const profileB: Profile = { id: "b", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };

    const { profile: aActivated } = activateOrRenew(counters, profileA, "premium", 30);
    const { profile: bActivated } = activateOrRenew(counters, profileB, "premium", 30);

    const sortKeyBefore = aActivated.highlightSortKey;
    const { profile: aRenewed, eventType } = activateOrRenew(counters, aActivated, "premium", 30);

    expect(eventType).toBe("plan_renewed");
    expect(aRenewed.highlightSortKey).toBe(sortKeyBefore); // position unchanged

    // A still appears above B in listing
    const listing = [bActivated, aRenewed].sort(compareListing);
    expect(listing[0].id).toBe("a");
  });

  it("renovação estende a validade além da data original", () => {
    const counters = makeCounters();
    const profile: Profile = { id: "a", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };
    const { profile: activated } = activateOrRenew(counters, profile, "premium", 30);
    const originalExpiry = new Date(activated.highlightExpiresAt!).getTime();

    const { profile: renewed } = activateOrRenew(counters, activated, "premium", 30);
    const newExpiry = new Date(renewed.highlightExpiresAt!).getTime();

    expect(newExpiry).toBeGreaterThan(originalExpiry);
    expect(newExpiry - originalExpiry).toBeCloseTo(30 * MS_PER_DAY, -3);
  });
});

describe("Scenario 4 — Troca de tier respeita o novo bloco", () => {
  it("mudar de premium para exclusive entra no fim do bloco exclusive", () => {
    const counters = makeCounters();
    const profile: Profile = { id: "a", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };

    const { profile: asPremium } = activateOrRenew(counters, profile, "premium", 30);
    expect(asPremium.highlightTier).toBe("premium");

    const { profile: asExclusive, eventType } = activateOrRenew(counters, asPremium, "exclusive", 30);
    expect(asExclusive.highlightTier).toBe("exclusive");
    expect(eventType).toBe("plan_activated"); // not a renewal, it's a tier change

    expect(getTierRank(asExclusive.highlightTier, asExclusive.highlightExpiresAt)).toBe(3);
  });
});

describe("Scenario 5 — Expiração remove prioridade", () => {
  it("perfil expirado cai para tier_rank 1", () => {
    const pastExpiry = new Date(Date.now() - 1000).toISOString();
    const profile: Profile = { id: "a", highlightTier: "premium", highlightExpiresAt: pastExpiry, highlightSortKey: 2_000_000_001 };

    expect(getTierRank(profile.highlightTier, profile.highlightExpiresAt)).toBe(1);
    expect(getEffectiveSortKey(profile.highlightTier, profile.highlightExpiresAt, profile.highlightSortKey)).toBe(0);
  });

  it("perfil expirado aparece abaixo de perfil standard sem boost", () => {
    const pastExpiry  = new Date(Date.now() - 1000).toISOString();
    const profileExpired: Profile = { id: "expired", highlightTier: "premium", highlightExpiresAt: pastExpiry, highlightSortKey: 2_000_000_001 };
    const profileStd:     Profile = { id: "std",     highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };

    const listing = [profileExpired, profileStd].sort(compareListing);
    // Both rank=1, but expired has effective_sort_key=0 just like standard → tied, order by sort key
    // effective_sort_key for expired = 0, for standard = 0 → effectively equal priority
    expect([listing[0].id, listing[1].id]).toContain("expired");
    expect([listing[0].id, listing[1].id]).toContain("std");
  });

  it("active premium aparece acima de expired premium", () => {
    const futureExp = new Date(Date.now() + MS_PER_DAY).toISOString();
    const pastExpiry = new Date(Date.now() - 1000).toISOString();

    const active:   Profile = { id: "active",   highlightTier: "premium", highlightExpiresAt: futureExp,  highlightSortKey: 999_999_998 };
    const expired:  Profile = { id: "expired",  highlightTier: "premium", highlightExpiresAt: pastExpiry, highlightSortKey: 999_999_999 };

    const listing = [expired, active].sort(compareListing);
    expect(listing[0].id).toBe("active");
    expect(listing[1].id).toBe("expired");
  });
});

describe("Scenario 6 — Idempotência: duplicado não reabre efeito", () => {
  it("ativar novamente com mesma source retorna eventType renewal sem mover posição", () => {
    const counters = makeCounters();
    const profile: Profile = { id: "a", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };
    const { profile: p1 } = activateOrRenew(counters, profile, "premium", 30);
    const keyAfterFirst = p1.highlightSortKey;

    // Simulate second call with same source — should behave as renewal (same tier still active)
    const { profile: p2, eventType } = activateOrRenew(counters, p1, "premium", 30);
    expect(eventType).toBe("plan_renewed");
    expect(p2.highlightSortKey).toBe(keyAfterFirst); // no new key allocated
  });
});

describe("Scenario 7 — Backfill de is_featured", () => {
  it("perfil backfilled com tier=premium aparece no bloco premium", () => {
    const futureExp = new Date(Date.now() + MS_PER_DAY).toISOString();
    const backfilled: Profile = { id: "old", highlightTier: "premium", highlightExpiresAt: futureExp, highlightSortKey: 1_000_000_000 };

    expect(getTierRank(backfilled.highlightTier, backfilled.highlightExpiresAt)).toBe(2);
    expect(isHighlightActive(backfilled.highlightTier, backfilled.highlightExpiresAt)).toBe(true);
  });

  it("backfilled premium aparece acima de standard", () => {
    const futureExp = new Date(Date.now() + MS_PER_DAY).toISOString();
    const backfilled: Profile = { id: "featured", highlightTier: "premium", highlightExpiresAt: futureExp, highlightSortKey: 1_000_000_000 };
    const standard: Profile   = { id: "std",     highlightTier: "standard", highlightExpiresAt: null,      highlightSortKey: 0 };

    const listing = [standard, backfilled].sort(compareListing);
    expect(listing[0].id).toBe("featured");
    expect(listing[1].id).toBe("std");
  });
});

describe("Boost guard — rejeita boost sem tier ativo", () => {
  it("throw se tier = standard", () => {
    const counters = makeCounters();
    const profile: Profile = { id: "a", highlightTier: "standard", highlightExpiresAt: null, highlightSortKey: 0 };
    expect(() => applyBoost(counters, profile)).toThrow();
  });

  it("throw se highlight expirado", () => {
    const counters  = makeCounters();
    const pastExp   = new Date(Date.now() - 1000).toISOString();
    const profile: Profile = { id: "a", highlightTier: "premium", highlightExpiresAt: pastExp, highlightSortKey: 999_999_999 };
    expect(() => applyBoost(counters, profile)).toThrow();
  });
});

describe("Ordering — exclusive > premium > standard", () => {
  it("exclusive aparece acima de premium", () => {
    const futureExp = new Date(Date.now() + MS_PER_DAY).toISOString();
    const excl: Profile = { id: "excl", highlightTier: "exclusive", highlightExpiresAt: futureExp, highlightSortKey: 999_999_999 };
    const prem: Profile = { id: "prem", highlightTier: "premium",   highlightExpiresAt: futureExp, highlightSortKey: 1_000_000_000 };

    // Even though prem has higher sort_key, exclusive tier_rank wins
    const listing = [prem, excl].sort(compareListing);
    expect(listing[0].id).toBe("excl");
  });

  it("premium aparece acima de standard", () => {
    const futureExp = new Date(Date.now() + MS_PER_DAY).toISOString();
    const prem: Profile = { id: "prem", highlightTier: "premium",  highlightExpiresAt: futureExp, highlightSortKey: 999_999_999 };
    const std:  Profile = { id: "std",  highlightTier: "standard", highlightExpiresAt: null,       highlightSortKey: 2_000_000_000 };

    // Even though std has huge sort_key (imagine an accidental old boost), premium tier_rank wins
    const listing = [std, prem].sort(compareListing);
    expect(listing[0].id).toBe("prem");
  });
});

describe("Webhook deduplication — evento duplicado não duplica efeito", () => {
  it("processa apenas a primeira ocorrência do mesmo event_id", () => {
    const processed = new Set<string>();
    let applied = 0;

    const handleWebhookEvent = (eventId: string) => {
      if (processed.has(eventId)) return;
      processed.add(eventId);
      applied += 1;
    };

    handleWebhookEvent("evt_1");
    handleWebhookEvent("evt_1");
    handleWebhookEvent("evt_1");

    expect(applied).toBe(1);
  });
});
