import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images") as File[];

    if (!images.length) {
      return NextResponse.json({ error: "No images selected" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const image of images) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image files are allowed" },
          { status: 400 }
        );
      }

      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Each image must be smaller than 5 MB" },
          { status: 400 }
        );
      }

      const extension = image.name.split(".").pop() || "jpg";
      const filePath = `products/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const buffer = Buffer.from(await image.arrayBuffer());

      const { error } = await supabase.storage
        .from("Product-Images")
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: false,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const { data } = supabase.storage
        .from("Product-Images")
        .getPublicUrl(filePath);

      urls.push(data.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}