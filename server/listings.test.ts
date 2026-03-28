import { describe, it, expect } from "vitest";

const BASE = `http://localhost:${process.env.PORT || 3000}`;

/** tRPC query — superjson wraps response in result.data.json */
async function trpcQuery(procedure: string, input?: any) {
  const url = new URL(`/api/trpc/${procedure}`, BASE);
  if (input !== undefined) {
    url.searchParams.set("input", JSON.stringify({ json: input }));
  }
  const r = await fetch(url.toString());
  const body = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(body));
  return body.result?.data?.json;
}

/** tRPC mutation — superjson wraps input in { json: ... } */
async function trpcMutate(procedure: string, input?: any) {
  const url = new URL(`/api/trpc/${procedure}`, BASE);
  const r = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(body));
  return body.result?.data?.json;
}

describe("Listings API", () => {
  it("should list all active listings", async () => {
    const data = await trpcQuery("listings.list");
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("should return listings with expected fields", async () => {
    const data = await trpcQuery("listings.list");
    const listing = data[0];
    expect(listing).toHaveProperty("id");
    expect(listing).toHaveProperty("titleAr");
    expect(listing).toHaveProperty("developer");
    expect(listing).toHaveProperty("project");
    expect(listing).toHaveProperty("areaSlug");
    expect(listing).toHaveProperty("images");
    expect(Array.isArray(listing.images)).toBe(true);
  });

  it("should get a single listing by id", async () => {
    const all = await trpcQuery("listings.list");
    const first = all[0];
    const single = await trpcQuery("listings.getById", { id: first.id });
    expect(single).toBeDefined();
    expect(single.id).toBe(first.id);
    expect(single.titleAr).toBe(first.titleAr);
  });

  it("should filter listings by areaSlug", async () => {
    const data = await trpcQuery("listings.list", { areaSlug: "new-capital" });
    expect(data.length).toBeGreaterThanOrEqual(1);
    for (const listing of data) {
      expect(listing.areaSlug).toBe("new-capital");
    }
  });

  it("should get filter options", async () => {
    const options = await trpcQuery("listings.filterOptions");
    expect(options).toHaveProperty("developers");
    expect(options).toHaveProperty("finishings");
    expect(options).toHaveProperty("rooms");
    expect(options).toHaveProperty("areaSlugs");
    expect(Array.isArray(options.developers)).toBe(true);
  });

  let createdId: number;

  it("should create a new listing", async () => {
    const result = await trpcMutate("listings.create", {
      titleAr: "وحدة اختبار",
      titleEn: "Test Unit",
      developer: "Test Developer",
      project: "Test Project",
      areaSlug: "new-capital",
      price: "1,500,000",
      rooms: 2,
      toilets: 1,
      finishing: "Finished",
      delivery: "2025",
      downpayment: "10%",
      monthlyInst: "15,000",
      images: ["/test/img1.jpg", "/test/img2.jpg"],
      featured: false,
      active: true,
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.success).toBe(true);
    createdId = result.id;
  });

  it("should update a listing", async () => {
    const result = await trpcMutate("listings.update", {
      id: createdId,
      titleEn: "Updated Test Unit",
      price: "2,000,000",
    });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should verify the update", async () => {
    const listing = await trpcQuery("listings.getById", { id: createdId });
    expect(listing).toBeDefined();
    expect(listing.titleEn).toBe("Updated Test Unit");
    expect(listing.price).toBe("2,000,000");
  });

  it("should delete a listing", async () => {
    const result = await trpcMutate("listings.delete", { id: createdId });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should verify deletion", async () => {
    const listing = await trpcQuery("listings.getById", { id: createdId });
    expect(listing).toBeNull();
  });

  it("should have 27 seeded listings after cleanup", async () => {
    const data = await trpcQuery("listings.list");
    expect(data.length).toBe(27);
  });
});
