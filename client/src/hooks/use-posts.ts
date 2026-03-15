import { useMutation } from "@tanstack/react-query";
import { api, type GenerateInput, type RefineInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useGeneratePost() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: GenerateInput) => {
      const validated = api.posts.generate.input.parse(data);
      const res = await fetch(api.posts.generate.path, {
        method: api.posts.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to generate post");
      }
      return res.json() as Promise<{
        variations: string[];
        tone: string;
        originalPrompt: string;
        image?: string;
      }>;
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRefinePost() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RefineInput) => {
      const validated = api.posts.refine.input.parse(data);
      const res = await fetch(api.posts.refine.path, {
        method: api.posts.refine.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to refine post");
      }
      return res.json() as Promise<{
        content: string;
        suggestions?: string;
        variations?: string[];
        image?: string;
      }>;
    },
    onError: (error: Error) => {
      toast({
        title: "Refinement Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
