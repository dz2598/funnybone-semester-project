import { createClient } from "@/utils/supabase/server";

export type LibraryCaption = {
  id: string;
  content: string;
  image_url: string;
  image_description: string | null;
};

export async function fetchCaptionCards(ids: string[]): Promise<LibraryCaption[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("captions")
    .select("id, content, images ( url, image_description )")
    .in("id", ids);

  if (error) throw new Error(error.message);
  const order = new Map(ids.map((id, index) => [id, index]));
  return (data ?? [])
    .map((caption: any) => {
      const image = Array.isArray(caption.images) ? caption.images[0] : caption.images;
      return {
        id: caption.id,
        content: caption.content,
        image_url: image?.url ?? "/placeholder.svg",
        image_description: image?.image_description ?? null,
      };
    })
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
