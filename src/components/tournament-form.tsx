'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { FileInput } from './ui/file-input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { uploadImage } from '@/utils/utils';
import type { Tournament } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const tournamentFormSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters.'),
  game: z.string().min(2, 'Game name must be at least 2 characters.'),
  description: z.string().optional(),
  date: z.date({
    required_error: 'A date is required.',
  }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm."),
  entryFee: z.coerce.number().min(0, 'Entry fee cannot be negative.'),
  currency: z.enum(['USD', 'INR']),
  maxTeamLimit: z.coerce.number().min(2, 'Team limit must be at least 2.'),
  qrCode: z.any().optional(),
  banner: z.any().optional(),
}).refine(data => {
    if (!(data as any).id) {
        return data.qrCode?.length > 0 && data.banner?.length > 0;
    }
    return true;
}, {
    message: "QR Code and Banner images are required for new tournaments.",
    path: ['banner'],
});

type TournamentFormValues = z.infer<typeof tournamentFormSchema> & { id?: string };

interface TournamentFormProps {
    tournament?: Tournament;
}

export function TournamentForm({ tournament }: TournamentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const isEditMode = !!tournament;

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      game: '',
      description: '',
      entryFee: 0,
      currency: 'USD',
      maxTeamLimit: 16,
      time: '12:00',
    },
  });

  useEffect(() => {
    if (tournament) {
      const tournamentDate = tournament.date.toDate ? tournament.date.toDate() : new Date(tournament.date as any)
      form.reset({
        ...tournament,
        date: tournamentDate,
        time: format(tournamentDate, 'HH:mm'),
      });
    }
  }, [tournament, form]);

  async function onSubmit(data: TournamentFormValues) {
    if (!firestore) return;
    
    try {
        const qrCodeFile = data.qrCode?.[0];
        const bannerFile = data.banner?.[0];

        let qrCodeUrl = tournament?.qrCodeUrl;
        let bannerUrl = tournament?.bannerUrl;

        if (qrCodeFile) {
            qrCodeUrl = await uploadImage(qrCodeFile);
        }
        if (bannerFile) {
            bannerUrl = await uploadImage(bannerFile);
        }
        
        const [hours, minutes] = data.time.split(':').map(Number);
        const combinedDateTime = new Date(data.date);
        combinedDateTime.setHours(hours, minutes);


        const tournamentData = {
            name: data.name,
            game: data.game,
            description: data.description,
            date: combinedDateTime,
            entryFee: data.entryFee,
            currency: data.currency,
            maxTeamLimit: data.maxTeamLimit,
            qrCodeUrl: qrCodeUrl,
            bannerUrl: bannerUrl,
        };

        if (isEditMode && tournament) {
            const tournamentRef = doc(firestore, 'tournaments', tournament.id);
            await updateDocumentNonBlocking(tournamentRef, tournamentData);
            toast({
                title: 'Tournament Updated!',
                description: `The tournament "${data.name}" has been successfully updated.`,
            });
        } else {
            const docRef = await addDocumentNonBlocking(collection(firestore, 'tournaments'), tournamentData);
            if (!docRef) {
              throw new Error('Failed to create tournament.');
            }
            toast({
                title: 'Tournament Created!',
                description: `The tournament "${data.name}" has been successfully created.`,
            });
        }

        router.push('/admin');

    } catch (error) {
        console.error("Error saving tournament:", error);
        toast({
            title: 'Error',
            description: 'Failed to save tournament.',
            variant: 'destructive',
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="Valorant Champions Tour" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="game"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game</FormLabel>
              <FormControl>
                <Input placeholder="Valorant" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell everyone about this tournament..."
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of the tournament, rules, and prizes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Tournament Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={'outline'}
                        className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                        )}
                        >
                        {field.value ? (
                            format(field.value, 'PPP')
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormItem>
                <FormLabel>Entry Fee</FormLabel>
                <div className="flex gap-2">
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="INR">INR</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="entryFee"
                        render={({ field }) => (
                           <FormControl>
                             <Input type="number" min="0" step="1" {...field} />
                           </FormControl>
                        )}
                    />
                </div>
                 <FormDescription>Set to 0 for free.</FormDescription>
                 <FormMessage />
            </FormItem>
            <FormField
            control={form.control}
            name="maxTeamLimit"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Team Limit</FormLabel>
                <FormControl>
                    <Input type="number" min="2" step="1" {...field} />
                </FormControl>
                <FormDescription>Max teams allowed.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="qrCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment QR Code</FormLabel>
              <FormControl>
                <FileInput
                    onChange={(e) => field.onChange(e.target.files)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                />
              </FormControl>
              <FormDescription>Upload the QR code for entry fee payment. {isEditMode && "Leave blank to keep existing."}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="banner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Banner</FormLabel>
              <FormControl>
                <FileInput
                    onChange={(e) => field.onChange(e.target.files)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                />
              </FormControl>
              <FormDescription>Upload a banner for the tournament page. {isEditMode && "Leave blank to keep existing."}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Tournament')}
        </Button>
      </form>
    </Form>
  );
}
