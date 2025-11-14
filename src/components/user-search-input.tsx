'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Input } from './ui/input';
import { Command, CommandGroup, CommandItem, CommandList } from './ui/command';
import { useDebounce } from '@/hooks/use-debounce';

interface UserSearchInputProps {
  onUserSelected: (user: UserProfile) => void;
  excludedUserIds: string[];
}

export function UserSearchInput({ onUserSelected, excludedUserIds }: UserSearchInputProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !debouncedSearch) return null;
    return query(
      collection(firestore, 'users'),
      where('username', '>=', debouncedSearch),
      where('username', '<=', debouncedSearch + '\uf8ff'),
      limit(5)
    );
  }, [firestore, debouncedSearch]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const handleSelect = (user: UserProfile) => {
    onUserSelected(user);
    setSearch('');
  };
  
  const filteredUsers = users?.filter(user => !excludedUserIds.includes(user.uid));

  return (
    <Command className="relative">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for player username..."
        className="w-full"
        disabled={isLoading}
      />
      {debouncedSearch && (
        <CommandList className="absolute top-11 z-10 w-full rounded-md border bg-background shadow-md">
          <CommandGroup>
            {isLoading && <CommandItem>Searching...</CommandItem>}
            {!isLoading &&
              filteredUsers &&
              filteredUsers.length > 0 &&
              filteredUsers.map((user) => (
                <CommandItem
                  key={user.uid}
                  onSelect={() => handleSelect(user)}
                  value={user.username!}
                  className="cursor-pointer"
                >
                  {user.username}
                </CommandItem>
              ))}
            {!isLoading && (!filteredUsers || filteredUsers.length === 0) && (
              <CommandItem>No users found.</CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}
