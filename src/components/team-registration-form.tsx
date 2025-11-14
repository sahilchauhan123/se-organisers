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
import { FileInput } from './ui/file-input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addDocumentNonBlocking, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { uploadImage } from '@/utils/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info } from 'lucide-react';

const registrationFormSchema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters.'),
  paymentScreenshot: z.any().refine(file => file?.length == 1, 'Payment proof is required.'),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export function TeamRegistrationForm({ tournamentId }: { tournamentId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      teamName: '',
    },
  });

  async function onSubmit(data: RegistrationFormValues) {
    if (!user || !firestore) {
        toast({ title: 'Error', description: 'You must be logged in to register a team.', variant: 'destructive'});
        return;
    }

    // Check for duplicate team name within the same tournament
    const teamsRef = collection(firestore, 'teams');
    const q = query(teamsRef, where('tournamentId', '==', tournamentId), where('teamName', '==', data.teamName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        toast({
            title: 'Team Name Taken',
            description: 'A team with this name has already registered for this tournament. Please choose a different name.',
            variant: 'destructive',
        });
        return;
    }


    try {
        const file = data.paymentScreenshot[0];
        const paymentScreenshotUrl = await uploadImage(file);

        const teamData = {
          tournamentId,
          teamLeaderId: user.uid,
          teamName: data.teamName,
          playerUsernames: [user.username!], // Only team leader is added by default
          paymentScreenshotURL: paymentScreenshotUrl,
          status: 'pending',
        };

        const teamRef = await addDocumentNonBlocking(collection(firestore, 'teams'), teamData);

        if (!teamRef) {
          throw new Error('Failed to create team.');
        }

        await addDocumentNonBlocking(collection(firestore, 'registrations'), {
            teamId: teamRef.id,
            tournamentId: tournamentId,
            status: 'pending'
        });

        toast({
          title: 'Registration Submitted!',
          description: 'Your team registration is pending approval.',
        });
        router.push('/dashboard');
    } catch (error) {
        console.error("Error submitting registration: ", error);
        toast({ title: 'Error', description: 'Failed to submit registration.', variant: 'destructive'});
    }
  }

  if (!user) {
    return (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">Please Login to Register</h3>
            <p className="text-muted-foreground mt-1">You need an account to create a team and join the tournament.</p>
            <Button asChild className="mt-4">
                <Link href="/login">Login or Sign Up</Link>
            </Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="teamName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="The Champions" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Heads Up!</AlertTitle>
            <AlertDescription>
                Please complete the payment first using the QR code in the "Tournament Details" section. You will need to upload the payment screenshot to register.
            </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="paymentScreenshot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Screenshot</FormLabel>
              <FormControl>
                <FileInput
                    onChange={(e) => field.onChange(e.target.files)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                />
              </FormControl>
              <FormDescription>Upload a screenshot of your payment confirmation.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </form>
    </Form>
  );
}
