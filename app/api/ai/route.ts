import { aiProvider } from "@/lib/ai";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { prompt, ...body }: { prompt: string } = await req.json();
  const { images } = body as { images?: string[] };

  const imagesContent =
    images?.map((image) => ({
      type: "image" as const,
      image: new URL(image),
    })) || [];

  const result = await streamText({
    model: aiProvider(process.env.OPENAI_API_MODEL!),
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }, ...imagesContent],
      },
    ],
  });

  return result.toUIMessageStreamResponse();
}
