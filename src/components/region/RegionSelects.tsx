import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
} from "@/lib/region.functions";

interface RegionItem {
  id: string;
  name: string;
}

interface SelectorProps {
  value: string;
  onSelect: (name: string, id: string) => void;
  items: RegionItem[];
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  loading?: boolean;
}

function RegionSelector({
  value,
  onSelect,
  items,
  placeholder,
  searchPlaceholder,
  disabled,
  loading,
}: SelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSelect = useCallback(
    (name: string, id: string) => {
      onSelect(name, id);
      setOpen(false);
      setSearch("");
    },
    [onSelect],
  );

  const filtered = items
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 120);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-none font-normal",
            !value && "text-muted-foreground",
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Memuat…
            </span>
          ) : value ? (
            value
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search ? "Tidak ditemukan" : "Ketik untuk mencari"}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item.name, item.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.name ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface RegionSelectsProps {
  fieldNames?: {
    province: string;
    city: string;
    district: string;
    village: string;
    postalCode: string;
  };
}

export function RegionSelects({
  fieldNames = {
    province: "province",
    city: "city",
    district: "district",
    village: "village",
    postalCode: "postal_code",
  },
}: RegionSelectsProps) {
  const { register, setValue, watch, formState } = useFormContext();

  const province = watch(fieldNames.province) ?? "";
  const city = watch(fieldNames.city) ?? "";
  const district = watch(fieldNames.district) ?? "";
  const village = watch(fieldNames.village) ?? "";

  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");

  const provs = useQuery({
    queryKey: ["region", "provinces"],
    queryFn: () => fetchProvinces(),
    staleTime: 86400000,
  });

  const cities = useQuery({
    queryKey: ["region", "regencies", provinceId],
    queryFn: () => fetchRegencies({ data: { provinceId } }),
    enabled: !!provinceId,
    staleTime: 86400000,
  });

  const districtsQ = useQuery({
    queryKey: ["region", "districts", cityId],
    queryFn: () => fetchDistricts({ data: { regencyId: cityId } }),
    enabled: !!cityId,
    staleTime: 86400000,
  });

  const villagesQ = useQuery({
    queryKey: ["region", "villages", districtId],
    queryFn: () => fetchVillages({ data: { districtId } }),
    enabled: !!districtId,
    staleTime: 86400000,
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !provs.data || !province) return;
    const match = provs.data.find((p) => p.name.toLowerCase() === province.toLowerCase());
    if (match) {
      setProvinceId(match.id);
      initialized.current = true;
    }
  }, [provs.data, province]);

  useEffect(() => {
    if (!cities.data || !city) return;
    const match = cities.data.find((c) => c.name.toLowerCase() === city.toLowerCase());
    if (match) setCityId(match.id);
  }, [cities.data, city]);

  useEffect(() => {
    if (!districtsQ.data || !district) return;
    const match = districtsQ.data.find((d) => d.name.toLowerCase() === district.toLowerCase());
    if (match) setDistrictId(match.id);
  }, [districtsQ.data, district]);

  const handleProvinceChange = useCallback(
    (name: string, id: string) => {
      setValue(fieldNames.province, name, { shouldValidate: true });
      setProvinceId(id);
      setCityId("");
      setDistrictId("");
      setValue(fieldNames.city, "", { shouldValidate: true });
      setValue(fieldNames.district, "", { shouldValidate: true });
      setValue(fieldNames.village, "", { shouldValidate: true });
    },
    [setValue, fieldNames],
  );

  const handleCityChange = useCallback(
    (name: string, id: string) => {
      setValue(fieldNames.city, name, { shouldValidate: true });
      setCityId(id);
      setDistrictId("");
      setValue(fieldNames.district, "", { shouldValidate: true });
      setValue(fieldNames.village, "", { shouldValidate: true });
    },
    [setValue, fieldNames],
  );

  const handleDistrictChange = useCallback(
    (name: string, id: string) => {
      setValue(fieldNames.district, name, { shouldValidate: true });
      setDistrictId(id);
      setValue(fieldNames.village, "", { shouldValidate: true });
    },
    [setValue, fieldNames],
  );

  const handleVillageChange = useCallback(
    (name: string, _id: string) => {
      setValue(fieldNames.village, name, { shouldValidate: true });
    },
    [setValue, fieldNames],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <RegionField
        label="Provinsi"
        error={formState.errors[fieldNames.province]?.message as string}
      >
        <RegionSelector
          value={province}
          onSelect={(name, id) => handleProvinceChange(name, id)}
          items={provs.data ?? []}
          placeholder="Pilih provinsi…"
          searchPlaceholder="Cari provinsi…"
          loading={provs.isLoading}
        />
      </RegionField>

      <RegionField
        label="Kota / Kabupaten"
        error={formState.errors[fieldNames.city]?.message as string}
      >
        <RegionSelector
          value={city}
          onSelect={(name, id) => handleCityChange(name, id)}
          items={cities.data ?? []}
          placeholder={provinceId ? "Pilih kota…" : "Pilih provinsi dulu"}
          searchPlaceholder="Cari kota…"
          disabled={!provinceId}
          loading={cities.isLoading}
        />
      </RegionField>

      <RegionField
        label="Kecamatan"
        error={formState.errors[fieldNames.district]?.message as string}
      >
        <RegionSelector
          value={district}
          onSelect={(name, id) => handleDistrictChange(name, id)}
          items={districtsQ.data ?? []}
          placeholder={cityId ? "Pilih kecamatan…" : "Pilih kota dulu"}
          searchPlaceholder="Cari kecamatan…"
          disabled={!cityId}
          loading={districtsQ.isLoading}
        />
      </RegionField>

      <RegionField
        label="Kelurahan / Desa"
        error={formState.errors[fieldNames.village]?.message as string}
      >
        <RegionSelector
          value={village}
          onSelect={(name, id) => handleVillageChange(name, id)}
          items={villagesQ.data ?? []}
          placeholder={districtId ? "Pilih kelurahan…" : "Pilih kecamatan dulu"}
          searchPlaceholder="Cari kelurahan…"
          disabled={!districtId}
          loading={villagesQ.isLoading}
        />
      </RegionField>

      <RegionField
        label="Kode Pos"
        error={formState.errors[fieldNames.postalCode]?.message as string}
      >
        <Input className="rounded-none" {...register(fieldNames.postalCode)} />
      </RegionField>
    </div>
  );
}

function RegionField({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
