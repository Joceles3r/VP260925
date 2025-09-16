import { useState } from 'react';
import { X, Upload, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ALLOWED_PROJECT_PRICES } from '@shared/constants';

const createProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255, "Titre trop long"),
  description: z.string().min(1, "La description est requise"),
  category: z.string().min(1, "La catégorie est requise"),
  targetAmount: z.string().min(1, "L'objectif de financement est requis"),
  unitPriceEUR: z.string().min(1, "Le prix unitaire est requis"),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      targetAmount: '',
      unitPriceEUR: '',
    },
  });

  const selectedUnitPrice = watch('unitPriceEUR');

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: CreateProjectForm) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('targetAmount', data.targetAmount);
      formData.append('unitPriceEUR', data.unitPriceEUR);
      
      if (videoFile) {
        formData.append('video', videoFile);
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Important for session-based auth
        // Don't set Content-Type for FormData, let the browser set it
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Project creation failed');
      }

      toast({
        title: "Projet créé avec succès",
        description: "Votre projet a été soumis pour révision administrative.",
      });

      reset();
      setVideoFile(null);
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Erreur lors de la création",
        description: error.message || "Une erreur est survenue lors de la création du projet.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setVideoFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Créer un nouveau projet
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="close-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Titre du projet
            </label>
            <Input
              {...register('title')}
              placeholder="Entrez le titre de votre projet"
              data-testid="input-title"
            />
            {errors.title && (
              <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <Textarea
              {...register('description')}
              placeholder="Décrivez votre projet en détail"
              rows={4}
              data-testid="input-description"
            />
            {errors.description && (
              <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Catégorie
            </label>
            <Input
              {...register('category')}
              placeholder="Ex: Film, Photo, Art visuel..."
              data-testid="input-category"
            />
            {errors.category && (
              <p className="text-destructive text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Prix unitaire */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Prix unitaire (nouvelles règles 16/09/2025)
            </label>
            <Select value={selectedUnitPrice} onValueChange={(value) => setValue('unitPriceEUR', value)}>
              <SelectTrigger className="w-full" data-testid="select-unit-price">
                <SelectValue placeholder="Sélectionnez le prix unitaire" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_PROJECT_PRICES.map(price => (
                  <SelectItem key={price} value={price.toString()}>
                    <div className="flex items-center">
                      <Euro className="w-4 h-4 mr-1" />
                      {price} €
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unitPriceEUR && (
              <p className="text-destructive text-sm mt-1">{errors.unitPriceEUR.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Prix maximum autorisé : 10€ (règles réglementaires 16/09/2025)
            </p>
          </div>

          {/* Objectif de financement */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Objectif de financement (€)
            </label>
            <Input
              {...register('targetAmount')}
              type="number"
              min="1"
              placeholder="Ex: 1000"
              data-testid="input-target-amount"
            />
            {errors.targetAmount && (
              <p className="text-destructive text-sm mt-1">{errors.targetAmount.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Objectif de financement total pour votre projet
            </p>
          </div>

          {/* Vidéo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Vidéo de présentation (optionnel)
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                id="video-upload"
                data-testid="input-video"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer text-primary hover:text-primary/80"
              >
                {videoFile ? videoFile.name : "Cliquez pour sélectionner une vidéo"}
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              data-testid="button-create"
            >
              {isSubmitting ? 'Création...' : 'Créer le projet'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}