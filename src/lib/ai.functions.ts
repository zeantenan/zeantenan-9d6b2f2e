import { createServerFn } from "@tanstack/react-start";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Anda adalah copywriter profesional untuk brand fashion muslim "ZEAN TENAN" — Original Gamis & Daster dari Kota Batik Indonesia.

Tugas Anda: membuat deskripsi produk berdasarkan informasi yang diberikan.

Aturan:
- Gunakan bahasa Indonesia yang menarik dan persuasif
- Tone: elegan, hangat, dan meyakinkan
- Jangan gunakan markdown atau HTML
- Jangan menyebutkan harga
- Fokus pada bahan, model, keunggulan, dan kesan yang diberikan`;

function buildPrompt(name: string, slug: string, categoryName: string | null, imageUrls: string[]) {
  return `Buatkan deskripsi untuk produk fashion muslim berikut:

Nama Produk: ${name}
Slug: ${slug}
Kategori: ${categoryName || "Tidak ada kategori"}
${imageUrls.length > 0 ? `Gambar produk tersedia di:\n${imageUrls.map((u) => `- ${u}`).join("\n")}` : "Tidak ada gambar produk"}

Buat 2 output dengan format:
SHORT: <deskripsi singkat, maksimal 2 kalimat, cocok untuk tampilan kartu produk>
LONG: <deskripsi lengkap, 3-5 paragraf, deskripsi detail produk untuk halaman produk, sertakan informasi bahan, model, keunggulan, dan kesan yang diberikan>`;
}

function parseResponse(text: string): { short_description: string; description: string } {
  let short = "";
  let full = "";

  const shortMatch = text.match(/^SHORT:\s*(.+)$/m);
  const longMatch = text.match(/^LONG:\s*([\s\S]+)$/m);

  if (shortMatch) short = shortMatch[1].trim();
  if (longMatch) full = longMatch[1].trim();

  return {
    short_description: short || text.slice(0, 150),
    description: full || text,
  };
}

async function callOpenAI(prompt: string, imageUrls: string[]): Promise<string> {
  const validImages = imageUrls.filter((u) => u.startsWith("http"));

  const body: Record<string, unknown> = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...validImages.slice(0, 2).map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ],
      },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (errText.includes("does not support image input") && validImages.length > 0) {
      const res2 = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ ...body, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }] }),
      });
      if (!res2.ok) {
        const err2 = await res2.text();
        console.error("OpenAI error (retry):", err2);
        return "";
      }
      const json2 = await res2.json();
      return json2.choices?.[0]?.message?.content ?? "";
    }
    console.error("OpenAI error:", errText);
    return "";
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export const generateProductDescription = createServerFn({ method: "POST" })
  .validator(
    (d: { name: string; slug: string; categoryName?: string | null; imageUrls?: string[] }) => {
      if (!d.name || !d.slug) throw new Error("Nama dan slug produk wajib diisi");
      return d;
    },
  )
  .handler(async ({ data }) => {
    if (!OPENAI_API_KEY) {
      return generateFallback(data.name, data.categoryName ?? null);
    }

    const prompt = buildPrompt(
      data.name,
      data.slug,
      data.categoryName ?? null,
      data.imageUrls ?? [],
    );

    const text = await callOpenAI(prompt, data.imageUrls ?? []);
    if (!text) return generateFallback(data.name, data.categoryName ?? null);

    return parseResponse(text);
  });

function generateFallback(
  name: string,
  categoryName: string | null,
): { short_description: string; description: string } {
  const cat = categoryName || "produk fashion muslim";
  const words = name.split(" ").filter(Boolean);

  return {
    short_description: `${name} — ${cat} elegan dari ZEAN TENAN. Nyaman dipakai, cocok untuk berbagai acara.`,
    description: `Perkenalkan ${name}, ${cat} terbaru dari ZEAN TENAN — Brand Original Gamis & Daster dari Kota Batik Indonesia.

${name} dirancang dengan gaya yang elegan dan modern, cocok untuk menemani aktivitas Anda sehari-hari maupun acara spesial. Diproduksi dengan bahan berkualitas terbaik yang nyaman dipakai sepanjang hari.

${words.length > 2 ? `Detail produk: ${words.slice(0, 4).join(" ")}. ` : ""}Setiap jahitan dikerjakan dengan teliti oleh pengrajin berpengalaman, menghasilkan produk yang rapi dan tahan lama. Tersedia dalam berbagai pilihan ukuran dan warna yang bisa disesuaikan dengan selera Anda.

Dapatkan ${name} sekarang dan tampil memukau dengan koleksi ZEAN TENAN.`,
  };
}
