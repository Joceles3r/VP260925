import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const CREATOR_DEPOSIT_PRICING = {
  clip: { maxSeconds: 10 * 60, feeEur: 2, label: "Clip (≤10min)" },
  doc: { maxSeconds: 30 * 60, feeEur: 5, label: "Documentaire (≤30min)" },
  film: { maxSeconds: 4 * 60 * 60, feeEur: 10, label: "Film (≤4h)" }
} as const;

const formSchema = z.object({
  projectId: z.string().min(1, "Sélectionnez un projet"),
  type: z.enum(["clip", "doc", "film"]),
  title: z.string().min(1, "Titre requis"),
  durationSec: z.number().min(1, "Durée invalide")
});

type FormData = z.infer<typeof formSchema>;

type Project = {
  id: string;
  title: string;
  category: string;
};

export function VideoUploadForm({ projects }: { projects: Project[] }) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<keyof typeof CREATOR_DEPOSIT_PRICING>("clip");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      type: "clip",
      title: "",
      durationSec: 0
    }
  });

  const initCheckoutMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/bunny/videos/init-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'initialisation du paiement");
      }
      
      return response.json() as Promise<{ checkoutUrl: string; sessionId: string; feeEur: number }>;
    },
    onSuccess: (data: any) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'initier le paiement",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: FormData) => {
    initCheckoutMutation.mutate(data);
  };

  const currentPricing = CREATOR_DEPOSIT_PRICING[selectedType];
  const maxDuration = Math.floor(currentPricing.maxSeconds / 60);

  return (
    <Card className="p-6 border-neon-purple/30 bg-gradient-to-b from-neon-purple/5 to-transparent">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-neon-purple/20">
          <Video className="w-6 h-6 text-neon-purple" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Déposer une vidéo</h2>
          <p className="text-sm text-muted-foreground">
            Via Bunny.net avec protection anti-piratage
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projet</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-project">
                      <SelectValue placeholder="Sélectionnez un projet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title} ({project.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de vidéo</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedType(value as keyof typeof CREATOR_DEPOSIT_PRICING);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-video-type">
                      <SelectValue placeholder="Type de vidéo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="clip">Clip (≤10min) - 2€</SelectItem>
                    <SelectItem value="doc">Documentaire (≤30min) - 5€</SelectItem>
                    <SelectItem value="film">Film (≤4h) - 10€</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Durée max: {maxDuration} minutes • Tarif: {currentPricing.feeEur}€
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre de la vidéo</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Mon super clip..."
                    data-testid="input-video-title"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationSec"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée (en secondes)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="300"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-video-duration"
                  />
                </FormControl>
                <FormDescription>
                  Maximum {currentPricing.maxSeconds} secondes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4 border-t border-neon-purple/20">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Tarif de dépôt</span>
              <span className="text-2xl font-bold text-neon-purple">
                {currentPricing.feeEur}€
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={initCheckoutMutation.isPending}
              data-testid="button-submit-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              {initCheckoutMutation.isPending ? "Chargement..." : "Payer et uploader"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
