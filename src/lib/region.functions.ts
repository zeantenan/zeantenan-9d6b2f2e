import { createServerFn } from "@tanstack/react-start";

const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

interface RegionItem {
  id: string;
  name: string;
}

function sortByName(items: RegionItem[]): RegionItem[] {
  return items.sort((a, b) => (a.name < b.name ? -1 : 1));
}

export const fetchProvinces = createServerFn({ method: "GET" }).handler(async () => {
  const res = await fetch(`${BASE}/provinces.json`);
  const data: RegionItem[] = await res.json();
  return data.sort((a, b) => a.id.localeCompare(b.id));
});

export const fetchRegencies = createServerFn({ method: "GET" })
  .validator((d: { provinceId: string }) => d)
  .handler(async ({ data }) => {
    const res = await fetch(`${BASE}/regencies/${data.provinceId}.json`);
    const items: RegionItem[] = await res.json();
    return sortByName(items);
  });

export const fetchDistricts = createServerFn({ method: "GET" })
  .validator((d: { regencyId: string }) => d)
  .handler(async ({ data }) => {
    const res = await fetch(`${BASE}/districts/${data.regencyId}.json`);
    const items: RegionItem[] = await res.json();
    return sortByName(items);
  });

export const fetchVillages = createServerFn({ method: "GET" })
  .validator((d: { districtId: string }) => d)
  .handler(async ({ data }) => {
    const res = await fetch(`${BASE}/villages/${data.districtId}.json`);
    const items: RegionItem[] = await res.json();
    return sortByName(items);
  });
